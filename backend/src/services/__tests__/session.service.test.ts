import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SessionService } from '../session.service';
import { ConnectionPool } from '../../database/connection-pool';

// Mock the ConnectionPool and logger
vi.mock('../../database/connection-pool');
vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('SessionService', () => {
  let sessionService: SessionService;
  let mockPool: vi.Mocked<ConnectionPool>;

  beforeEach(() => {
    mockPool = {
      query: vi.fn(),
      queryOne: vi.fn(),
    } as any;

    sessionService = new SessionService(mockPool);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generateSessionToken', () => {
    it('should generate a valid UUID v4 token', () => {
      const token = sessionService.generateSessionToken();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuidRegex.test(token)).toBe(true);
    });

    it('should generate unique tokens', () => {
      const token1 = sessionService.generateSessionToken();
      const token2 = sessionService.generateSessionToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('createFingerprint', () => {
    it('should create consistent fingerprint for same inputs', () => {
      const ip = '192.168.1.1';
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';
      
      const fingerprint1 = sessionService.createFingerprint(ip, userAgent);
      const fingerprint2 = sessionService.createFingerprint(ip, userAgent);
      
      expect(fingerprint1).toBe(fingerprint2);
      expect(fingerprint1).toHaveLength(64); // SHA-256 hex length
    });

    it('should include additional data in fingerprint', () => {
      const ip = '192.168.1.1';
      const userAgent = 'Chrome';
      const additionalData = { screen: '1920x1080', timezone: 'UTC' };
      
      const fingerprint1 = sessionService.createFingerprint(ip, userAgent);
      const fingerprint2 = sessionService.createFingerprint(ip, userAgent, additionalData);
      
      expect(fingerprint1).not.toBe(fingerprint2);
    });
  });

  describe('createSession', () => {
    it('should create new session successfully', async () => {
      const surveyId = 1;
      const ipAddress = '192.168.1.1';
      const userAgent = 'Chrome';

      // Mock no existing session
      mockPool.queryOne.mockResolvedValueOnce(null);
      // Mock successful session creation
      mockPool.query.mockResolvedValueOnce([]);

      const result = await sessionService.createSession(surveyId, ipAddress, userAgent);

      expect(result.sessionToken).toBeDefined();
      expect(result.surveyId).toBe(surveyId);
      expect(result.isLocked).toBe(false);
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should detect and handle duplicate session', async () => {
      const surveyId = 1;
      const ipAddress = '192.168.1.1';
      const userAgent = 'Chrome';

      const existingSession = {
        session_token: 'existing-token-123',
        survey_id: surveyId,
        fingerprint_hash: 'existing-fingerprint',
        is_locked: false,
        locked_reason: null,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        created_at: new Date(),
      };

      // Mock existing session found
      mockPool.queryOne.mockResolvedValueOnce(existingSession);
      // Mock session lock update
      mockPool.query.mockResolvedValueOnce([]);

      const result = await sessionService.createSession(surveyId, ipAddress, userAgent);

      expect(result.sessionToken).toBe('existing-token-123');
      expect(result.isLocked).toBe(true);
      expect(result.lockedReason).toBe('Duplicate session attempt detected');
    });

    it('should handle database errors gracefully', async () => {
      const surveyId = 1;
      const ipAddress = '192.168.1.1';
      const userAgent = 'Chrome';

      mockPool.queryOne.mockRejectedValueOnce(new Error('Database error'));

      await expect(sessionService.createSession(surveyId, ipAddress, userAgent))
        .rejects.toThrow('Failed to create session');
    });
  });

  describe('findActiveSession', () => {
    it('should find active session', async () => {
      const surveyId = 1;
      const fingerprint = 'test-fingerprint-hash';

      const mockSession = {
        session_token: 'active-token',
        survey_id: surveyId,
        fingerprint_hash: fingerprint,
        is_locked: false,
        locked_reason: null,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        created_at: new Date(),
      };

      mockPool.queryOne.mockResolvedValueOnce(mockSession);

      const result = await sessionService.findActiveSession(surveyId, fingerprint);

      expect(result).toBeDefined();
      expect(result?.sessionToken).toBe('active-token');
      expect(result?.surveyId).toBe(surveyId);
      expect(result?.isLocked).toBe(false);
    });

    it('should return null when no active session found', async () => {
      const surveyId = 1;
      const fingerprint = 'non-existent-fingerprint';

      mockPool.queryOne.mockResolvedValueOnce(null);

      const result = await sessionService.findActiveSession(surveyId, fingerprint);

      expect(result).toBeNull();
    });
  });

  describe('validateSession', () => {
    it('should validate active session', async () => {
      const sessionToken = 'valid-token';
      const surveyId = 1;

      const mockSession = {
        session_token: sessionToken,
        survey_id: surveyId,
        fingerprint_hash: 'fingerprint',
        is_locked: false,
        locked_reason: null,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        created_at: new Date(),
      };

      mockPool.queryOne.mockResolvedValueOnce(mockSession);

      const result = await sessionService.validateSession(sessionToken, surveyId);

      expect(result.isValid).toBe(true);
      expect(result.isLocked).toBe(false);
      expect(result.isExpired).toBe(false);
      expect(result.sessionData).toBeDefined();
    });

    it('should detect expired session', async () => {
      const sessionToken = 'expired-token';

      const mockSession = {
        session_token: sessionToken,
        survey_id: 1,
        fingerprint_hash: 'fingerprint',
        is_locked: false,
        locked_reason: null,
        expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired
        created_at: new Date(),
      };

      mockPool.queryOne.mockResolvedValueOnce(mockSession);

      const result = await sessionService.validateSession(sessionToken);

      expect(result.isValid).toBe(false);
      expect(result.isExpired).toBe(true);
      expect(result.reason).toBe('Session expired');
    });

    it('should detect locked session', async () => {
      const sessionToken = 'locked-token';

      const mockSession = {
        session_token: sessionToken,
        survey_id: 1,
        fingerprint_hash: 'fingerprint',
        is_locked: true,
        locked_reason: 'Security violation',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        created_at: new Date(),
      };

      mockPool.queryOne.mockResolvedValueOnce(mockSession);

      const result = await sessionService.validateSession(sessionToken);

      expect(result.isValid).toBe(false);
      expect(result.isLocked).toBe(true);
      expect(result.reason).toBe('Security violation');
    });

    it('should handle non-existent session', async () => {
      const sessionToken = 'non-existent-token';

      mockPool.queryOne.mockResolvedValueOnce(null);

      const result = await sessionService.validateSession(sessionToken);

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Session not found');
    });
  });

  describe('lockSession', () => {
    it('should lock session successfully', async () => {
      const sessionToken = 'token-to-lock';
      const reason = 'Security violation';

      mockPool.query.mockResolvedValueOnce([]);

      await expect(sessionService.lockSession(sessionToken, reason))
        .resolves.not.toThrow();

      expect(mockPool.query).toHaveBeenCalledWith(
        'UPDATE session_locks SET is_locked = true, locked_reason = $1 WHERE session_token = $2',
        [reason, sessionToken]
      );
    });

    it('should handle lock errors', async () => {
      const sessionToken = 'token-to-lock';
      const reason = 'Security violation';

      mockPool.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(sessionService.lockSession(sessionToken, reason))
        .rejects.toThrow('Failed to lock session');
    });
  });

  describe('unlockSession', () => {
    it('should unlock session successfully', async () => {
      const sessionToken = 'token-to-unlock';

      mockPool.query.mockResolvedValueOnce([]);

      await expect(sessionService.unlockSession(sessionToken))
        .resolves.not.toThrow();

      expect(mockPool.query).toHaveBeenCalledWith(
        'UPDATE session_locks SET is_locked = false, locked_reason = NULL WHERE session_token = $1',
        [sessionToken]
      );
    });
  });

  describe('extendSession', () => {
    it('should extend session successfully', async () => {
      const sessionToken = 'token-to-extend';
      const additionalHours = 12;

      mockPool.query.mockResolvedValueOnce([]);

      await expect(sessionService.extendSession(sessionToken, additionalHours))
        .resolves.not.toThrow();

      expect(mockPool.query).toHaveBeenCalled();
    });
  });

  describe('getSessionMetrics', () => {
    it('should return session metrics', async () => {
      const surveyId = 1;

      const mockMetrics = {
        total_sessions: '100',
        active_sessions: '25',
        expired_sessions: '50',
        locked_sessions: '10',
      };

      mockPool.queryOne.mockResolvedValueOnce(mockMetrics);

      const result = await sessionService.getSessionMetrics(surveyId);

      expect(result.totalSessions).toBe(100);
      expect(result.activeSessions).toBe(25);
      expect(result.expiredSessions).toBe(50);
      expect(result.lockedSessions).toBe(10);
    });

    it('should handle metrics query errors', async () => {
      mockPool.queryOne.mockRejectedValueOnce(new Error('Database error'));

      const result = await sessionService.getSessionMetrics();

      expect(result.totalSessions).toBe(0);
      expect(result.activeSessions).toBe(0);
      expect(result.expiredSessions).toBe(0);
      expect(result.lockedSessions).toBe(0);
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should cleanup expired sessions and return count', async () => {
      const mockResult = new Array(15); // Simulate 15 deleted sessions
      mockPool.query.mockResolvedValueOnce(mockResult);

      const deletedCount = await sessionService.cleanupExpiredSessions();

      expect(deletedCount).toBe(15);
      expect(mockPool.query).toHaveBeenCalledWith(
        'DELETE FROM session_locks WHERE expires_at < NOW()'
      );
    });

    it('should handle cleanup errors gracefully', async () => {
      mockPool.query.mockRejectedValueOnce(new Error('Cleanup error'));

      const deletedCount = await sessionService.cleanupExpiredSessions();

      expect(deletedCount).toBe(0);
    });
  });

  describe('cleanupSurveySessions', () => {
    it('should cleanup expired sessions for specific survey', async () => {
      const surveyId = 1;
      const mockResult = new Array(5); // Simulate 5 deleted sessions
      mockPool.query.mockResolvedValueOnce(mockResult);

      const deletedCount = await sessionService.cleanupSurveySessions(surveyId);

      expect(deletedCount).toBe(5);
      expect(mockPool.query).toHaveBeenCalledWith(
        'DELETE FROM session_locks WHERE survey_id = $1 AND expires_at < NOW()',
        [surveyId]
      );
    });
  });
});