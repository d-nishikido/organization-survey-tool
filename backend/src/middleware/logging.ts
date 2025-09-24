import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../utils/logger';

export async function loggingMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  // Log request
  logger.info({
    type: 'request',
    method: request.method,
    url: request.url,
    query: request.query,
    params: request.params,
    requestId: request.id,
  });
}
