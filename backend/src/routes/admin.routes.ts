import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { adminService } from '../services/admin.service';
import { logger } from '../utils/logger';

export const adminRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // GET /api/admin/stats - Get dashboard statistics
  fastify.get(
    '/admin/stats',
    {
      schema: {
        description: 'Get admin dashboard statistics',
        tags: ['admin'],
        summary: '管理ダッシュボード統計情報取得',
        response: {
          200: {
            type: 'object',
            properties: {
              active_surveys: { type: 'number', description: 'Number of active surveys' },
              total_responses: { type: 'number', description: 'Total number of responses' },
              response_rate: { type: 'number', description: 'Response rate percentage' },
              avg_completion_time: { type: 'number', description: 'Average completion time in minutes' },
            },
            required: ['active_surveys', 'total_responses', 'response_rate', 'avg_completion_time'],
          },
          500: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      try {
        const stats = await adminService.getDashboardStats();
        return reply.code(200).send(stats);
      } catch (error) {
        logger.error('Failed to fetch admin stats:', error);
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch dashboard statistics',
        });
      }
    },
  );

  // GET /api/admin/activity - Get recent activity logs
  fastify.get<{
    Querystring: {
      limit?: number;
    };
  }>(
    '/admin/activity',
    {
      schema: {
        description: 'Get recent activity logs',
        tags: ['admin'],
        summary: '最近のアクティビティ取得',
        querystring: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              default: 10,
              minimum: 1,
              maximum: 100,
              description: 'Number of activity items to return',
            },
          },
        },
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                type: {
                  type: 'string',
                  enum: ['survey_created', 'responses_received', 'report_generated'],
                },
                title: { type: 'string' },
                description: { type: 'string' },
                timestamp: { type: 'string', format: 'date-time' },
                icon: { type: 'string' },
              },
              required: ['id', 'type', 'title', 'description', 'timestamp', 'icon'],
            },
          },
          500: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { limit = 10 } = request.query;
        const activity = await adminService.getRecentActivity(limit);
        return reply.code(200).send(activity);
      } catch (error) {
        logger.error('Failed to fetch recent activity:', error);
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to fetch recent activity',
        });
      }
    },
  );
};
