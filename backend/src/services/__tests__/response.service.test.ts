import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { ResponseService } from '../response.service';
import { ConnectionPool } from '../../database/connection-pool';

// Mock the ConnectionPool
vi.mock('../../database/connection-pool');
vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('ResponseService', () => {
  let responseService: ResponseService;
  let mockPool: vi.Mocked<ConnectionPool>;

  beforeEach(() => {
    mockPool = {
      query: vi.fn(),
      queryOne: vi.fn(),
      connect: vi.fn(),
    } as any;

    responseService = new ResponseService({ pool: mockPool });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generateSessionToken', () => {
    it('should generate a valid UUID v4 token', () => {
      const token = responseService.generateSessionToken();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuidRegex.test(token)).toBe(true);
    });

    it('should generate unique tokens', () => {
      const token1 = responseService.generateSessionToken();
      const token2 = responseService.generateSessionToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('createFingerprint', () => {
    it('should create a consistent fingerprint for same inputs', () => {
      const ip = '192.168.1.1';
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      
      const fingerprint1 = responseService.createFingerprint(ip, userAgent);
      const fingerprint2 = responseService.createFingerprint(ip, userAgent);
      
      expect(fingerprint1).toBe(fingerprint2);
      expect(fingerprint1).toHaveLength(64); // SHA-256 hex length
    });

    it('should create different fingerprints for different inputs', () => {
      const fingerprint1 = responseService.createFingerprint('192.168.1.1', 'Chrome');
      const fingerprint2 = responseService.createFingerprint('192.168.1.2', 'Chrome');
      const fingerprint3 = responseService.createFingerprint('192.168.1.1', 'Firefox');
      
      expect(fingerprint1).not.toBe(fingerprint2);
      expect(fingerprint1).not.toBe(fingerprint3);
      expect(fingerprint2).not.toBe(fingerprint3);
    });
  });

  describe('createSession', () => {
    it('should create a new session successfully', async () => {
      const surveyId = 1;
      const ipAddress = '192.168.1.1';
      const userAgent = 'Chrome';

      // Mock no existing session
      mockPool.queryOne.mockResolvedValueOnce(null);
      // Mock successful session creation
      mockPool.query.mockResolvedValueOnce([]);
      // Mock survey questions count
      mockPool.queryOne.mockResolvedValueOnce({ question_count: 10 });
      // Mock progress creation
      mockPool.query.mockResolvedValueOnce([]);

      const result = await responseService.createSession(surveyId, ipAddress, userAgent);

      expect(result.isValid).toBe(true);
      expect(result.isLocked).toBe(false);
      expect(result.sessionToken).toBeDefined();
      expect(result.fingerprint).toBeDefined();
    });

    it('should detect duplicate session', async () => {
      const surveyId = 1;
      const ipAddress = '192.168.1.1';
      const userAgent = 'Chrome';

      // Mock existing session
      mockPool.queryOne.mockResolvedValueOnce({
        session_token: 'existing-token',
        is_locked: false,
        locked_reason: null,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      });

      const result = await responseService.createSession(surveyId, ipAddress, userAgent);

      expect(result.isValid).toBe(false);
      expect(result.sessionToken).toBe('existing-token');
    });

    it('should handle database errors', async () => {
      const surveyId = 1;
      const ipAddress = '192.168.1.1';
      const userAgent = 'Chrome';

      mockPool.queryOne.mockRejectedValueOnce(new Error('Database error'));

      await expect(responseService.createSession(surveyId, ipAddress, userAgent))
        .rejects.toThrow('Failed to create anonymous session');
    });
  });

  describe('submitResponse', () => {
    it('should submit responses successfully', async () => {
      const responseData = {
        survey_id: 1,
        session_id: 'valid-session-id',
        responses: [
          { question_id: 1, answer: 5 },
          { question_id: 2, answer: 'Good' },
        ],
      };

      // Mock session validation
      mockPool.queryOne.mockResolvedValueOnce({
        is_locked: false,
        locked_reason: null,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      // Mock database client for transaction
      const mockClient = {
        query: vi.fn().mockResolvedValue({ rows: [{ count: 10 }] }),
        release: vi.fn(),
      };
      mockPool.connect.mockResolvedValueOnce(mockClient as any);

      const result = await responseService.submitResponse(responseData);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Response submitted successfully');
      expect(result.response_id).toBeDefined();
      expect(result.submitted_at).toBeDefined();
    });

    it('should handle invalid session', async () => {
      const responseData = {
        survey_id: 1,
        session_id: 'invalid-session-id',
        responses: [{ question_id: 1, answer: 5 }],
      };

      // Mock invalid session
      mockPool.queryOne.mockResolvedValueOnce(null);

      await expect(responseService.submitResponse(responseData))
        .rejects.toThrow('Failed to submit response');
    });
  });

  describe('getProgress', () => {
    it('should return progress successfully', async () => {
      const sessionId = 'valid-session-id';
      const surveyId = 1;

      const mockProgress = {
        survey_id: 1,
        session_token: sessionId,
        total_questions: 10,
        answered_questions: 5,
        completion_percentage: 50.0,
        last_activity_at: new Date().toISOString(),
        is_completed: false,
      };

      mockPool.queryOne.mockResolvedValueOnce(mockProgress);

      const result = await responseService.getProgress(sessionId, surveyId);

      expect(result.survey_id).toBe(1);
      expect(result.session_id).toBe(sessionId);
      expect(result.progress_percentage).toBe(50);
      expect(result.total_questions).toBe(10);
      expect(result.answered_questions).toBe(5);
    });

    it('should handle progress not found', async () => {
      const sessionId = 'non-existent-session';
      const surveyId = 1;

      mockPool.queryOne.mockResolvedValueOnce(null);

      await expect(responseService.getProgress(sessionId, surveyId))
        .rejects.toThrow('Failed to get response progress');
    });
  });

  describe('validateSession', () => {
    it('should validate valid session', async () => {
      const sessionToken = 'valid-token';
      const surveyId = 1;

      mockPool.queryOne.mockResolvedValueOnce({
        is_locked: false,
        locked_reason: null,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      });

      const result = await responseService.validateSession(sessionToken, surveyId);

      expect(result.isValid).toBe(true);
      expect(result.isLocked).toBe(false);
    });

    it('should detect expired session', async () => {
      const sessionToken = 'expired-token';
      const surveyId = 1;

      mockPool.queryOne.mockResolvedValueOnce({
        is_locked: false,
        locked_reason: null,
        expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      });

      const result = await responseService.validateSession(sessionToken, surveyId);

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Session expired');
    });

    it('should detect locked session', async () => {
      const sessionToken = 'locked-token';
      const surveyId = 1;

      mockPool.queryOne.mockResolvedValueOnce({
        is_locked: true,
        locked_reason: 'Duplicate attempt',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      const result = await responseService.validateSession(sessionToken, surveyId);

      expect(result.isValid).toBe(false);
      expect(result.isLocked).toBe(true);
      expect(result.reason).toBe('Duplicate attempt');
    });

    it('should handle non-existent session', async () => {
      const sessionToken = 'non-existent-token';
      const surveyId = 1;

      mockPool.queryOne.mockResolvedValueOnce(null);

      const result = await responseService.validateSession(sessionToken, surveyId);

      expect(result.isValid).toBe(false);
      expect(result.isLocked).toBe(false);
    });
  });

  describe('completeSession', () => {
    it('should complete session successfully', async () => {
      const sessionToken = 'valid-token';
      const surveyId = 1;

      mockPool.query.mockResolvedValueOnce([]);
      mockPool.query.mockResolvedValueOnce([]);

      await expect(responseService.completeSession(sessionToken, surveyId))
        .resolves.not.toThrow();

      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('should handle database errors during completion', async () => {
      const sessionToken = 'valid-token';
      const surveyId = 1;

      mockPool.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(responseService.completeSession(sessionToken, surveyId))
        .rejects.toThrow('Failed to complete session');
    });
  });

  describe('cleanExpiredSessions', () => {
    it('should clean expired sessions and return count', async () => {
      const mockResult = new Array(5); // Simulate 5 deleted sessions
      mockPool.query.mockResolvedValueOnce(mockResult);

      const deletedCount = await responseService.cleanExpiredSessions();

      expect(deletedCount).toBe(5);
      expect(mockPool.query).toHaveBeenCalledWith(
        'DELETE FROM session_locks WHERE expires_at < NOW()'
      );
    });

    it('should handle cleanup errors gracefully', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Cleanup error'));

      const deletedCount = await responseService.cleanExpiredSessions();

      expect(deletedCount).toBe(0);
    });
  });
});