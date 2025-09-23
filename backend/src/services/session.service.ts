import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { ConnectionPool } from '../database/connection-pool';
import { logger } from '../utils/logger';

export interface SessionData {
  sessionToken: string;
  surveyId: number;
  fingerprint: string;
  isLocked: boolean;
  lockedReason?: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface SessionValidation {
  isValid: boolean;
  isLocked: boolean;
  isExpired: boolean;
  reason?: string;
  sessionData?: SessionData;
}

export interface SessionMetrics {
  totalSessions: number;
  activeSessions: number;
  expiredSessions: number;
  lockedSessions: number;
}

export class SessionService {
  private pool: ConnectionPool;
  private readonly SESSION_EXPIRY_HOURS = 24;
  private readonly CLEANUP_INTERVAL_HOURS = 6;

  constructor(pool: ConnectionPool) {
    this.pool = pool;
    this.startCleanupTask();
  }

  /**
   * Generate a secure session token
   */
  generateSessionToken(): string {
    return uuidv4();
  }

  /**
   * Create a secure fingerprint from request metadata
   */
  createFingerprint(ipAddress: string, userAgent: string, additionalData?: Record<string, any>): string {
    const baseData = `${ipAddress}:${userAgent}`;
    const fullData = additionalData ? `${baseData}:${JSON.stringify(additionalData)}` : baseData;
    return createHash('sha256').update(fullData).digest('hex');
  }

  /**
   * Create a new session with duplicate prevention
   */
  async createSession(
    surveyId: number, 
    ipAddress: string, 
    userAgent: string,
    additionalFingerprint?: Record<string, any>
  ): Promise<SessionData> {
    const fingerprint = this.createFingerprint(ipAddress, userAgent, additionalFingerprint);
    const ipHash = createHash('sha256').update(ipAddress).digest('hex');

    try {
      // Check for existing active session
      const existingSession = await this.findActiveSession(surveyId, fingerprint);
      
      if (existingSession) {
        logger.warn('Attempted to create duplicate session', {
          surveyId,
          fingerprintHash: fingerprint.substring(0, 12) + '...',
          existingSessionId: existingSession.sessionToken.substring(0, 8) + '...',
        });
        
        // Return existing session but mark as locked due to duplicate attempt
        await this.lockSession(existingSession.sessionToken, 'Duplicate session attempt detected');
        return {
          ...existingSession,
          isLocked: true,
          lockedReason: 'Duplicate session attempt detected'
        };
      }

      // Create new session
      const sessionToken = this.generateSessionToken();
      const expiresAt = new Date(Date.now() + this.SESSION_EXPIRY_HOURS * 60 * 60 * 1000);

      await this.pool.query(
        `INSERT INTO session_locks 
         (survey_id, session_token, ip_hash, fingerprint_hash, is_locked, locked_reason, expires_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [surveyId, sessionToken, ipHash, fingerprint, false, null, expiresAt]
      );

      const sessionData: SessionData = {
        sessionToken,
        surveyId,
        fingerprint,
        isLocked: false,
        expiresAt,
        createdAt: new Date(),
      };

      logger.info('New session created successfully', {
        surveyId,
        sessionId: sessionToken.substring(0, 8) + '...',
        expiresAt: expiresAt.toISOString(),
      });

      return sessionData;

    } catch (error) {
      logger.error('Failed to create session', { error, surveyId });
      throw new Error('Failed to create session');
    }
  }

  /**
   * Find active session by survey and fingerprint
   */
  async findActiveSession(surveyId: number, fingerprint: string): Promise<SessionData | null> {
    try {
      const session = await this.pool.queryOne(
        `SELECT session_token, survey_id, fingerprint_hash, is_locked, locked_reason, expires_at, created_at
         FROM session_locks 
         WHERE survey_id = $1 AND fingerprint_hash = $2 AND expires_at > NOW()
         ORDER BY created_at DESC
         LIMIT 1`,
        [surveyId, fingerprint]
      );

      if (!session) {
        return null;
      }

      return {
        sessionToken: session.session_token,
        surveyId: session.survey_id,
        fingerprint: session.fingerprint_hash,
        isLocked: session.is_locked,
        lockedReason: session.locked_reason,
        expiresAt: new Date(session.expires_at),
        createdAt: new Date(session.created_at),
      };

    } catch (error) {
      logger.error('Failed to find active session', { error, surveyId, fingerprint });
      return null;
    }
  }

  /**
   * Validate session token
   */
  async validateSession(sessionToken: string, surveyId?: number): Promise<SessionValidation> {
    try {
      const query = surveyId 
        ? `SELECT * FROM session_locks WHERE session_token = $1 AND survey_id = $2`
        : `SELECT * FROM session_locks WHERE session_token = $1`;
      
      const params = surveyId ? [sessionToken, surveyId] : [sessionToken];
      const session = await this.pool.queryOne(query, params);

      if (!session) {
        return {
          isValid: false,
          isLocked: false,
          isExpired: false,
          reason: 'Session not found',
        };
      }

      const now = new Date();
      const expiresAt = new Date(session.expires_at);
      const isExpired = expiresAt < now;

      if (isExpired) {
        return {
          isValid: false,
          isLocked: session.is_locked,
          isExpired: true,
          reason: 'Session expired',
        };
      }

      if (session.is_locked) {
        return {
          isValid: false,
          isLocked: true,
          isExpired: false,
          reason: session.locked_reason || 'Session locked',
        };
      }

      const sessionData: SessionData = {
        sessionToken: session.session_token,
        surveyId: session.survey_id,
        fingerprint: session.fingerprint_hash,
        isLocked: session.is_locked,
        lockedReason: session.locked_reason,
        expiresAt: new Date(session.expires_at),
        createdAt: new Date(session.created_at),
      };

      return {
        isValid: true,
        isLocked: false,
        isExpired: false,
        sessionData,
      };

    } catch (error) {
      logger.error('Failed to validate session', { error, sessionToken, surveyId });
      return {
        isValid: false,
        isLocked: false,
        isExpired: false,
        reason: 'Validation error',
      };
    }
  }

  /**
   * Lock a session with reason
   */
  async lockSession(sessionToken: string, reason: string): Promise<void> {
    try {
      await this.pool.query(
        `UPDATE session_locks 
         SET is_locked = true, locked_reason = $1 
         WHERE session_token = $2`,
        [reason, sessionToken]
      );

      logger.info('Session locked', {
        sessionId: sessionToken.substring(0, 8) + '...',
        reason,
      });

    } catch (error) {
      logger.error('Failed to lock session', { error, sessionToken, reason });
      throw new Error('Failed to lock session');
    }
  }

  /**
   * Unlock a session
   */
  async unlockSession(sessionToken: string): Promise<void> {
    try {
      await this.pool.query(
        `UPDATE session_locks 
         SET is_locked = false, locked_reason = NULL 
         WHERE session_token = $1`,
        [sessionToken]
      );

      logger.info('Session unlocked', {
        sessionId: sessionToken.substring(0, 8) + '...',
      });

    } catch (error) {
      logger.error('Failed to unlock session', { error, sessionToken });
      throw new Error('Failed to unlock session');
    }
  }

  /**
   * Extend session expiry time
   */
  async extendSession(sessionToken: string, additionalHours: number = 24): Promise<void> {
    try {
      const newExpiryTime = new Date(Date.now() + additionalHours * 60 * 60 * 1000);
      
      await this.pool.query(
        `UPDATE session_locks 
         SET expires_at = $1 
         WHERE session_token = $2`,
        [newExpiryTime, sessionToken]
      );

      logger.info('Session extended', {
        sessionId: sessionToken.substring(0, 8) + '...',
        newExpiryTime: newExpiryTime.toISOString(),
      });

    } catch (error) {
      logger.error('Failed to extend session', { error, sessionToken });
      throw new Error('Failed to extend session');
    }
  }

  /**
   * Get session metrics for monitoring
   */
  async getSessionMetrics(surveyId?: number): Promise<SessionMetrics> {
    try {
      const whereClause = surveyId ? 'WHERE survey_id = $1' : '';
      const params = surveyId ? [surveyId] : [];

      const metrics = await this.pool.queryOne(
        `SELECT 
           COUNT(*) as total_sessions,
           COUNT(CASE WHEN expires_at > NOW() AND is_locked = false THEN 1 END) as active_sessions,
           COUNT(CASE WHEN expires_at <= NOW() THEN 1 END) as expired_sessions,
           COUNT(CASE WHEN is_locked = true THEN 1 END) as locked_sessions
         FROM session_locks ${whereClause}`,
        params
      );

      return {
        totalSessions: parseInt(metrics?.total_sessions || '0'),
        activeSessions: parseInt(metrics?.active_sessions || '0'),
        expiredSessions: parseInt(metrics?.expired_sessions || '0'),
        lockedSessions: parseInt(metrics?.locked_sessions || '0'),
      };

    } catch (error) {
      logger.error('Failed to get session metrics', { error, surveyId });
      return {
        totalSessions: 0,
        activeSessions: 0,
        expiredSessions: 0,
        lockedSessions: 0,
      };
    }
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const result = await this.pool.query(
        `DELETE FROM session_locks WHERE expires_at < NOW()`
      );

      const deletedCount = result.length;
      if (deletedCount > 0) {
        logger.info('Cleaned up expired sessions', { deletedCount });
      }

      return deletedCount;

    } catch (error) {
      logger.error('Failed to clean up expired sessions', { error });
      return 0;
    }
  }

  /**
   * Clean up sessions for a specific survey
   */
  async cleanupSurveySessions(surveyId: number): Promise<number> {
    try {
      const result = await this.pool.query(
        `DELETE FROM session_locks WHERE survey_id = $1 AND expires_at < NOW()`,
        [surveyId]
      );

      const deletedCount = result.length;
      if (deletedCount > 0) {
        logger.info('Cleaned up expired sessions for survey', { surveyId, deletedCount });
      }

      return deletedCount;

    } catch (error) {
      logger.error('Failed to clean up survey sessions', { error, surveyId });
      return 0;
    }
  }

  /**
   * Start background cleanup task
   */
  private startCleanupTask(): void {
    const cleanupInterval = this.CLEANUP_INTERVAL_HOURS * 60 * 60 * 1000; // Convert to milliseconds
    
    setInterval(async () => {
      try {
        await this.cleanupExpiredSessions();
      } catch (error) {
        logger.error('Background session cleanup failed', { error });
      }
    }, cleanupInterval);

    logger.info('Session cleanup task started', {
      intervalHours: this.CLEANUP_INTERVAL_HOURS,
    });
  }
}