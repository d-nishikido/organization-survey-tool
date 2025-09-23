import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
import { CustomError, ErrorCode } from '../types/error.types';

export async function errorHandler(
  error: FastifyError | CustomError | ZodError | Error,
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

  let statusCode = 500;
  let errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
  let message = 'Internal Server Error';
  let details: unknown = undefined;

  // Handle different error types
  if (error instanceof CustomError) {
    statusCode = error.statusCode;
    errorCode = error.code;
    message = error.message;
    details = error.details;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    errorCode = ErrorCode.VALIDATION_ERROR;
    message = 'Validation failed';
    details = error.errors;
  } else if ('statusCode' in error && typeof error.statusCode === 'number') {
    statusCode = error.statusCode;
    message = error.message || 'An error occurred';

    // Map status codes to error codes
    switch (statusCode) {
      case 400:
        errorCode = ErrorCode.BAD_REQUEST;
        break;
      case 401:
        errorCode = ErrorCode.AUTHENTICATION_ERROR;
        break;
      case 403:
        errorCode = ErrorCode.AUTHORIZATION_ERROR;
        break;
      case 404:
        errorCode = ErrorCode.NOT_FOUND;
        break;
      case 409:
        errorCode = ErrorCode.CONFLICT;
        break;
      case 429:
        errorCode = ErrorCode.RATE_LIMIT_EXCEEDED;
        break;
      default:
        errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
    }
  }

  // Prepare error response
  const errorResponse = {
    error: {
      code: errorCode,
      message,
      statusCode,
      ...(process.env.NODE_ENV !== 'production' && details ? { details } : {}),
    },
    timestamp: new Date().toISOString(),
    path: request.url,
    method: request.method,
    requestId: request.id,
  };

  // Don't expose internal errors in production
  if (statusCode === 500 && process.env.NODE_ENV === 'production') {
    errorResponse.error.message = 'Internal Server Error';
  }

  // Send error response
  await reply.status(statusCode).send(errorResponse);
}
