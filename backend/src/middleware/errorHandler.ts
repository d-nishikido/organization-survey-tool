import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { logger } from '../utils/logger';

export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  // Log error details
  logger.error({
    err: error,
    request: {
      method: request.method,
      url: request.url,
      params: request.params,
      query: request.query,
      headers: request.headers,
    },
  });

  // Determine status code
  const statusCode = error.statusCode || 500;

  // Prepare error response
  const errorResponse: {
    error: {
      message: string;
      code?: string;
      statusCode: number;
    };
    timestamp: string;
    path: string;
    method: string;
  } = {
    error: {
      message: error.message || 'Internal Server Error',
      code: error.code,
      statusCode,
    },
    timestamp: new Date().toISOString(),
    path: request.url,
    method: request.method,
  };

  // Don't expose internal errors in production
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    errorResponse.error.message = 'Internal Server Error';
    delete errorResponse.error.code;
  }

  // Send error response
  await reply.status(statusCode).send(errorResponse);
}