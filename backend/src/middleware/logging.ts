import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../utils/logger';

export async function loggingMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const start = Date.now();

  // Log request
  logger.info({
    type: 'request',
    method: request.method,
    url: request.url,
    query: request.query,
    params: request.params,
    requestId: request.id,
  });

  // Add response logging
  reply.addHook('onSend', async (request, reply, payload) => {
    const duration = Date.now() - start;

    logger.info({
      type: 'response',
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      duration: `${duration}ms`,
      requestId: request.id,
    });

    // Log slow requests
    if (duration > 1000) {
      logger.warn({
        message: 'Slow request detected',
        method: request.method,
        url: request.url,
        duration: `${duration}ms`,
        requestId: request.id,
      });
    }

    return payload;
  });
}
