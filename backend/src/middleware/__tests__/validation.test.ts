import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { validateBody, validateQuery, validateParams } from '../validation';
import { ValidationError } from '../../types/error.types';

describe('Validation Middleware', () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;

  beforeEach(() => {
    mockRequest = {
      body: {},
      query: {},
      params: {},
    };
    mockReply = {};
  });

  describe('validateBody', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    it('should validate correct body data', async () => {
      mockRequest.body = { name: 'Test', age: 25 };
      const middleware = validateBody(schema);
      
      await expect(
        middleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      ).resolves.not.toThrow();
      
      expect(mockRequest.body).toEqual({ name: 'Test', age: 25 });
    });

    it('should throw ValidationError for invalid body', async () => {
      mockRequest.body = { name: 'Test', age: 'invalid' };
      const middleware = validateBody(schema);
      
      await expect(
        middleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for missing required fields', async () => {
      mockRequest.body = { name: 'Test' };
      const middleware = validateBody(schema);
      
      await expect(
        middleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('validateQuery', () => {
    const schema = z.object({
      page: z.coerce.number().positive(),
      limit: z.coerce.number().positive().max(100),
    });

    it('should validate correct query parameters', async () => {
      mockRequest.query = { page: '1', limit: '10' };
      const middleware = validateQuery(schema);
      
      await expect(
        middleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      ).resolves.not.toThrow();
      
      expect(mockRequest.query).toEqual({ page: 1, limit: 10 });
    });

    it('should throw ValidationError for invalid query', async () => {
      mockRequest.query = { page: '-1', limit: '10' };
      const middleware = validateQuery(schema);
      
      await expect(
        middleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('validateParams', () => {
    const schema = z.object({
      id: z.coerce.number().positive(),
    });

    it('should validate correct path parameters', async () => {
      mockRequest.params = { id: '123' };
      const middleware = validateParams(schema);
      
      await expect(
        middleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      ).resolves.not.toThrow();
      
      expect(mockRequest.params).toEqual({ id: 123 });
    });

    it('should throw ValidationError for invalid params', async () => {
      mockRequest.params = { id: 'abc' };
      const middleware = validateParams(schema);
      
      await expect(
        middleware(mockRequest as FastifyRequest, mockReply as FastifyReply)
      ).rejects.toThrow(ValidationError);
    });
  });
});