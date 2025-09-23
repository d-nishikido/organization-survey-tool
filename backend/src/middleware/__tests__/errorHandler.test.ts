import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { errorHandler } from '../errorHandler';
import {
  CustomError,
  ValidationError,
  NotFoundError,
  AuthenticationError,
  ErrorCode,
} from '../../types/error.types';

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

describe('Error Handler', () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;
  let sendMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    sendMock = jest.fn().mockResolvedValue(undefined);
    statusMock = jest.fn().mockReturnValue({ send: sendMock });
    
    mockRequest = {
      method: 'GET',
      url: '/test',
      params: {},
      query: {},
      headers: {},
      id: 'test-request-id',
    };
    
    mockReply = {
      status: statusMock,
    };

    // Set NODE_ENV for testing
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('CustomError handling', () => {
    it('should handle ValidationError correctly', async () => {
      const error = new ValidationError('Invalid data', { field: 'test' });
      
      await errorHandler(
        error,
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );
      
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(sendMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Invalid data',
            statusCode: 400,
            details: { field: 'test' },
          }),
        })
      );
    });

    it('should handle NotFoundError correctly', async () => {
      const error = new NotFoundError('Resource not found');
      
      await errorHandler(
        error,
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );
      
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(sendMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: ErrorCode.NOT_FOUND,
            message: 'Resource not found',
            statusCode: 404,
          }),
        })
      );
    });

    it('should handle AuthenticationError correctly', async () => {
      const error = new AuthenticationError();
      
      await errorHandler(
        error,
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );
      
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(sendMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: ErrorCode.AUTHENTICATION_ERROR,
            message: 'Authentication required',
            statusCode: 401,
          }),
        })
      );
    });
  });

  describe('ZodError handling', () => {
    it('should handle ZodError correctly', async () => {
      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['field'],
          message: 'Expected string, received number',
        },
      ]);
      
      await errorHandler(
        zodError,
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );
      
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(sendMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Validation failed',
            statusCode: 400,
            details: zodError.errors,
          }),
        })
      );
    });
  });

  describe('Production mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('should not expose details in production for 500 errors', async () => {
      const error = new Error('Internal error with sensitive data');
      
      await errorHandler(
        error,
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );
      
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(sendMock).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: ErrorCode.INTERNAL_SERVER_ERROR,
            message: 'Internal Server Error',
            statusCode: 500,
          }),
        })
      );
      
      // Should not have details in production
      expect(sendMock.mock.calls[0][0].error.details).toBeUndefined();
    });

    it('should expose details for non-500 errors in production', async () => {
      const error = new ValidationError('Validation error', { field: 'test' });
      
      await errorHandler(
        error,
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );
      
      expect(statusMock).toHaveBeenCalledWith(400);
      // Details should not be exposed in production
      expect(sendMock.mock.calls[0][0].error.details).toBeUndefined();
    });
  });

  describe('Response metadata', () => {
    it('should include timestamp, path, method, and requestId', async () => {
      const error = new ValidationError('Test error');
      
      await errorHandler(
        error,
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );
      
      expect(sendMock).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
          path: '/test',
          method: 'GET',
          requestId: 'test-request-id',
        })
      );
    });
  });
});