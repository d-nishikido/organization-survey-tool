import { FastifyInstance, FastifyPluginAsync } from 'fastify';

export const healthRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get(
    '/health',
    {
      schema: {
        description: 'Health check endpoint',
        tags: ['health'],
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string', format: 'date-time' },
              uptime: { type: 'number' },
              environment: { type: 'string' },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      return reply.code(200).send({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
      });
    },
  );

  fastify.get(
    '/ready',
    {
      schema: {
        description: 'Readiness check endpoint',
        tags: ['health'],
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              services: {
                type: 'object',
                properties: {
                  database: { type: 'string' },
                  api: { type: 'string' },
                },
              },
            },
          },
          503: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      // TODO: Add actual database connection check
      const services = {
        database: 'ready',
        api: 'ready',
      };

      const allReady = Object.values(services).every((status) => status === 'ready');

      if (allReady) {
        return reply.code(200).send({
          status: 'ready',
          services,
        });
      } else {
        return reply.code(503).send({
          status: 'not ready',
          services,
        });
      }
    },
  );
};
