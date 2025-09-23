import { FastifyRequest, FastifyReply } from 'fastify';
import { anonymityMiddleware, validateAnonymousSession } from '../anonymity';

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

describe('Anonymity Middleware', () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;
  let headerMock: jest.Mock;

  beforeEach(() => {
    headerMock = jest.fn().mockReturnThis();
    
    mockRequest = {
      method: 'POST',
      url: '/api/responses',
      ip: '192.168.1.1',
      headers: {
        'x-forwarded-for': '192.168.1.1',
        'x-real-ip': '192.168.1.1',
        'authorization': 'Bearer token',
        'cookie': 'session=abc123',
        'user-agent': 'Mozilla/5.0',
      },
      body: {},
      query: {},
    };
    
    mockReply = {
      header: headerMock,
    };

    jest.clearAllMocks();
  });

  describe('anonymityMiddleware', () => {
    it('should mask IP address', async () => {
      await anonymityMiddleware(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );
      
      expect(mockRequest.ip).toBe('anonymous');
    });

    it('should add anonymous response header', async () => {
      await anonymityMiddleware(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );
      
      expect(headerMock).toHaveBeenCalledWith('X-Anonymous-Response', 'true');
    });

    it('should clear cookies in response', async () => {
      await anonymityMiddleware(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );
      
      expect(headerMock).toHaveBeenCalledWith('Set-Cookie', '');
    });

    it('should log sanitized request without sensitive headers', async () => {
      const { logger } = require('../../utils/logger');
      
      await anonymityMiddleware(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );
      
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'x-forwarded-for': expect.anything(),
            'x-real-ip': expect.anything(),
            'authorization': expect.anything(),
            'cookie': expect.anything(),
          }),
        })
      );
      
      // Should keep non-sensitive headers
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            'user-agent': 'Mozilla/5.0',
          }),
        })
      );
    });
  });

  describe('validateAnonymousSession', () => {
    it('should validate valid UUID session ID in body', () => {
      mockRequest.body = {
        session_id: '550e8400-e29b-41d4-a716-446655440000',
      };
      
      expect(() => {
        validateAnonymousSession(
          mockRequest as FastifyRequest,
          mockReply as FastifyReply
        );
      }).not.toThrow();
    });

    it('should validate valid UUID session ID in query', () => {
      mockRequest.query = {
        session_id: '550e8400-e29b-41d4-a716-446655440000',
      };
      
      expect(() => {
        validateAnonymousSession(
          mockRequest as FastifyRequest,
          mockReply as FastifyReply
        );
      }).not.toThrow();
    });

    it('should validate valid UUID session ID in headers', () => {
      mockRequest.headers = {
        'x-session-id': '550e8400-e29b-41d4-a716-446655440000',
      };
      
      expect(() => {
        validateAnonymousSession(
          mockRequest as FastifyRequest,
          mockReply as FastifyReply
        );
      }).not.toThrow();
    });

    it('should warn when session ID is missing', () => {
      const { logger } = require('../../utils/logger');
      mockRequest.body = {};
      mockRequest.query = {};
      mockRequest.headers = {};
      
      validateAnonymousSession(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );
      
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Missing session ID for anonymous request',
        })
      );
    });

    it('should throw error for invalid session ID format', () => {
      const { logger } = require('../../utils/logger');
      mockRequest.body = {
        session_id: 'not-a-uuid',
      };
      
      expect(() => {
        validateAnonymousSession(
          mockRequest as FastifyRequest,
          mockReply as FastifyReply
        );
      }).toThrow('Invalid session format');
      
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid session ID format - potential anonymity breach',
          sessionId: 'not-a-uuid',
        })
      );
    });

    it('should accept various valid UUID formats', () => {
      const validUuids = [
        '550e8400-e29b-41d4-a716-446655440000',
        'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      ];
      
      validUuids.forEach((uuid) => {
        mockRequest.body = { session_id: uuid };
        
        expect(() => {
          validateAnonymousSession(
            mockRequest as FastifyRequest,
            mockReply as FastifyReply
          );
        }).not.toThrow();
      });
    });
  });
});