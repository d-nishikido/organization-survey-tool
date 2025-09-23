import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../utils/logger';

/**
 * Middleware to ensure anonymity by removing or masking identifiable information
 * from requests and responses for anonymous surveys
 */
export function anonymityMiddleware(request: FastifyRequest, reply: FastifyReply): void {
  // Remove identifiable headers from logging
  const sanitizedHeaders = { ...request.headers };
  delete sanitizedHeaders['x-forwarded-for'];
  delete sanitizedHeaders['x-real-ip'];
  delete sanitizedHeaders['authorization'];
  delete sanitizedHeaders['cookie'];

  // Override request properties to mask sensitive data
  Object.defineProperty(request, 'ip', {
    value: 'anonymous',
    writable: false,
    configurable: true,
  });

  // Log sanitized request
  logger.info({
    method: request.method,
    url: request.url,
    headers: sanitizedHeaders,
    message: 'Anonymous request received',
  });

  // Add response header to indicate anonymous processing
  reply.header('X-Anonymous-Response', 'true');

  // Ensure no user-identifying cookies are set
  reply.header('Set-Cookie', '');
}

/**
 * Verify session is properly anonymized
 */
export function validateAnonymousSession(request: FastifyRequest, reply: FastifyReply): void {
  const sessionId =
    (request.body as any)?.session_id ||
    (request.query as any)?.session_id ||
    request.headers['x-session-id'];

  if (!sessionId) {
    logger.warn({
      method: request.method,
      url: request.url,
      message: 'Missing session ID for anonymous request',
    });
  }

  // Ensure session ID is a UUID and doesn't contain identifiable information
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (sessionId && !uuidRegex.test(sessionId)) {
    logger.error({
      message: 'Invalid session ID format - potential anonymity breach',
      sessionId,
    });
    throw new Error('Invalid session format');
  }
}
