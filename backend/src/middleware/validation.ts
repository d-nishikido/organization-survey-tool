import { FastifyRequest, FastifyReply } from 'fastify';
import { ZodSchema } from 'zod';
import { ValidationError } from '../types/error.types';

export function validateBody<T>(schema: ZodSchema<T>) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    try {
      const validatedData = schema.parse(request.body);
      request.body = validatedData;
    } catch (error) {
      throw new ValidationError('Invalid request body', error);
    }
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    try {
      const validatedData = schema.parse(request.query);
      request.query = validatedData;
    } catch (error) {
      throw new ValidationError('Invalid query parameters', error);
    }
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    try {
      const validatedData = schema.parse(request.params);
      request.params = validatedData;
    } catch (error) {
      throw new ValidationError('Invalid path parameters', error);
    }
  };
}
