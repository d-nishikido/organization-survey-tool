import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { ConnectionPool } from '../database/connection-pool';
import { SubmitResponseDto, ResponseProgress, ResponseConfirmation } from '../types/response.types';
import { logger } from '../utils/logger';

export interface SessionInfo {
  sessionToken: string;
  fingerprint: string;
  isValid: boolean;
  isLocked: boolean;
  lockedReason?: string;
}

export interface ResponseServiceOptions {
  pool: ConnectionPool;
}

export class ResponseService {
  private pool: ConnectionPool;

  constructor(options: ResponseServiceOptions) {
    this.pool = options.pool;
  }

  /**
   * Generate a unique session token for anonymous survey responses
   */
  generateSessionToken(): string {
    return uuidv4();
  }

  /**
   * Create a fingerprint hash from request information for duplicate prevention
   */
  createFingerprint(ipAddress: string, userAgent: string): string {
    const combined = `${ipAddress}:${userAgent}`;
    return createHash('sha256').update(combined).digest('hex');
  }

  /**
   * Create a new anonymous session
   */
  async createSession(surveyId: number, ipAddress: string, userAgent: string): Promise<SessionInfo> {
    const sessionToken = this.generateSessionToken();
    const fingerprint = this.createFingerprint(ipAddress, userAgent);
    const ipHash = createHash('sha256').update(ipAddress).digest('hex');

    try {
      // Check for existing session with same fingerprint
      const existingSession = await this.pool.queryOne(
        `SELECT session_token, is_locked, locked_reason, expires_at 
         FROM session_locks 
         WHERE survey_id = $1 AND fingerprint_hash = $2 AND expires_at > NOW()`,
        [surveyId, fingerprint]
      );

      if (existingSession) {
        logger.warn('Duplicate session attempt detected', {
          surveyId,
          fingerprint: fingerprint.substring(0, 8) + '...',
          existingSessionToken: existingSession.session_token.substring(0, 8) + '...',
        });

        return {
          sessionToken: existingSession.session_token,
          fingerprint,
          isValid: false,
          isLocked: existingSession.is_locked,
          lockedReason: existingSession.locked_reason,
        };
      }

      // Create new session lock
      await this.pool.query(
        `INSERT INTO session_locks 
         (survey_id, session_token, ip_hash, fingerprint_hash, is_locked, expires_at)
         VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '24 hours')`,
        [surveyId, sessionToken, ipHash, fingerprint, false]
      );

      // Initialize progress tracking
      const surveyQuestions = await this.pool.queryOne(
        `SELECT COUNT(*) as question_count 
         FROM survey_questions 
         WHERE survey_id = $1 AND is_active = true`,
        [surveyId]
      );

      await this.pool.query(
        `INSERT INTO survey_progress 
         (survey_id, session_token, total_questions, completion_percentage, started_at, last_activity_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())`,
        [surveyId, sessionToken, surveyQuestions?.question_count || 0, 0]
      );

      logger.info('New anonymous session created', {
        surveyId,
        sessionToken: sessionToken.substring(0, 8) + '...',
        totalQuestions: surveyQuestions?.question_count || 0,
      });

      return {
        sessionToken,
        fingerprint,
        isValid: true,
        isLocked: false,
      };
    } catch (error) {
      logger.error('Failed to create session', { error, surveyId });
      throw new Error('Failed to create anonymous session');
    }
  }

  /**
   * Submit anonymous survey responses
   */
  async submitResponse(responseData: SubmitResponseDto): Promise<ResponseConfirmation> {
    const { survey_id, session_id, responses } = responseData;

    try {
      // Validate session
      const sessionValid = await this.validateSession(session_id, survey_id);
      if (!sessionValid.isValid) {
        throw new Error('Invalid or expired session');
      }

      // Begin transaction for atomic response submission
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');

        const responseId = uuidv4();
        const submittedAt = new Date().toISOString();

        // Insert responses
        for (const response of responses) {
          let responseValue = null;
          let responseText = null;
          let responseData = null;

          // Determine response type and store accordingly
          if (typeof response.answer === 'number') {
            responseValue = response.answer;
          } else if (typeof response.answer === 'string') {
            responseText = response.answer;
          } else {
            responseData = JSON.stringify(response.answer);
          }

          await client.query(
            `INSERT INTO survey_responses 
             (survey_id, question_id, response_value, response_text, response_data, session_token, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [survey_id, response.question_id, responseValue, responseText, responseData, session_id, submittedAt]
          );
        }

        // Update progress
        const totalQuestions = await client.query(
          `SELECT COUNT(*) as count 
           FROM survey_questions 
           WHERE survey_id = $1 AND is_active = true`,
          [survey_id]
        );

        const answeredQuestions = responses.length;
        const progressPercentage = totalQuestions.rows[0]?.count 
          ? Math.round((answeredQuestions / parseInt(totalQuestions.rows[0].count)) * 100)
          : 0;

        await client.query(
          `UPDATE survey_progress 
           SET answered_questions = $1, 
               completion_percentage = $2, 
               last_activity_at = NOW(),
               is_completed = $3
           WHERE survey_id = $4 AND session_token = $5`,
          [answeredQuestions, progressPercentage, progressPercentage >= 100, survey_id, session_id]
        );

        await client.query('COMMIT');

        logger.info('Response submitted successfully', {
          surveyId: survey_id,
          sessionToken: session_id.substring(0, 8) + '...',
          responseCount: responses.length,
          progressPercentage,
        });

        return {
          success: true,
          message: 'Response submitted successfully',
          response_id: responseId,
          submitted_at: submittedAt,
        };

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      logger.error('Failed to submit response', { error, surveyId: survey_id, sessionId: session_id });
      throw new Error('Failed to submit response');
    }
  }

  /**
   * Get response progress for a session
   */
  async getProgress(sessionId: string, surveyId: number): Promise<ResponseProgress> {
    try {
      const progress = await this.pool.queryOne(
        `SELECT survey_id, session_token, total_questions, answered_questions, 
                completion_percentage, last_activity_at, is_completed
         FROM survey_progress 
         WHERE session_token = $1 AND survey_id = $2`,
        [sessionId, surveyId]
      );

      if (!progress) {
        throw new Error('Progress not found');
      }

      return {
        survey_id: progress.survey_id,
        session_id: progress.session_token,
        total_questions: progress.total_questions || 0,
        answered_questions: progress.answered_questions || 0,
        progress_percentage: parseFloat(progress.completion_percentage) || 0,
        last_updated: progress.last_activity_at,
      };

    } catch (error) {
      logger.error('Failed to get progress', { error, sessionId, surveyId });
      throw new Error('Failed to get response progress');
    }
  }

  /**
   * Validate session token and check for locks
   */
  async validateSession(sessionToken: string, surveyId: number): Promise<{ isValid: boolean; isLocked: boolean; reason?: string }> {
    try {
      const session = await this.pool.queryOne(
        `SELECT is_locked, locked_reason, expires_at 
         FROM session_locks 
         WHERE session_token = $1 AND survey_id = $2`,
        [sessionToken, surveyId]
      );

      if (!session) {
        return { isValid: false, isLocked: false };
      }

      if (new Date(session.expires_at) < new Date()) {
        return { isValid: false, isLocked: false, reason: 'Session expired' };
      }

      if (session.is_locked) {
        return { isValid: false, isLocked: true, reason: session.locked_reason };
      }

      return { isValid: true, isLocked: false };

    } catch (error) {
      logger.error('Failed to validate session', { error, sessionToken, surveyId });
      return { isValid: false, isLocked: false, reason: 'Validation error' };
    }
  }

  /**
   * Complete a session and mark survey as finished
   */
  async completeSession(sessionToken: string, surveyId: number): Promise<void> {
    try {
      // Mark progress as completed
      await this.pool.query(
        `UPDATE survey_progress 
         SET is_completed = true, 
             completion_percentage = 100, 
             completed_at = NOW(),
             last_activity_at = NOW()
         WHERE session_token = $1 AND survey_id = $2`,
        [sessionToken, surveyId]
      );

      // Lock the session to prevent further responses
      await this.pool.query(
        `UPDATE session_locks 
         SET is_locked = true, 
             locked_reason = 'Survey completed'
         WHERE session_token = $1 AND survey_id = $2`,
        [sessionToken, surveyId]
      );

      logger.info('Session completed successfully', {
        sessionToken: sessionToken.substring(0, 8) + '...',
        surveyId,
      });

    } catch (error) {
      logger.error('Failed to complete session', { error, sessionToken, surveyId });
      throw new Error('Failed to complete session');
    }
  }

  /**
   * Clean up expired sessions (utility method for background jobs)
   */
  async cleanExpiredSessions(): Promise<number> {
    try {
      const result = await this.pool.query(
        `DELETE FROM session_locks WHERE expires_at < NOW()`
      );

      const deletedCount = result.length;
      if (deletedCount > 0) {
        logger.info('Cleaned expired sessions', { deletedCount });
      }

      return deletedCount;

    } catch (error) {
      logger.error('Failed to clean expired sessions', { error });
      return 0;
    }
  }
}