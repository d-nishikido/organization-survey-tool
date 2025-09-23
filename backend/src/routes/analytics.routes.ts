import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { validateQuery } from '../middleware/validation';

const AnalyticsQuerySchema = z.object({
  survey_id: z.coerce.number().positive(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
});

const TrendsQuerySchema = z.object({
  survey_id: z.coerce.number().positive().optional(),
  category: z
    .enum([
      'engagement',
      'satisfaction',
      'leadership',
      'culture',
      'growth',
      'worklife',
      'communication',
      'other',
    ])
    .optional(),
  period: z.enum(['daily', 'weekly', 'monthly', 'quarterly']).default('monthly'),
});

const SummaryResponseSchema = z.object({
  survey_id: z.number(),
  survey_title: z.string(),
  total_responses: z.number(),
  completion_rate: z.number(),
  average_scores: z.record(z.string(), z.number()),
  response_distribution: z.record(z.string(), z.number()),
  generated_at: z.string(),
});

const TrendsResponseSchema = z.object({
  period: z.string(),
  data_points: z.array(
    z.object({
      date: z.string(),
      value: z.number(),
      count: z.number(),
    }),
  ),
  trend: z.enum(['increasing', 'decreasing', 'stable']),
  change_percentage: z.number(),
});

export const analyticsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Get analytics summary
  fastify.get(
    '/analytics/summary',
    {
      schema: {
        description: 'Get analytics summary for a survey',
        tags: ['analytics'],
        querystring: AnalyticsQuerySchema,
        response: {
          200: SummaryResponseSchema,
          404: {
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
      preHandler: [validateQuery(AnalyticsQuerySchema)],
    },
    async (request, reply) => {
      const { survey_id } = request.query as any;
      // TODO: Implement analytics service
      const mockSummary = {
        survey_id,
        survey_title: 'Employee Engagement Survey',
        total_responses: 0,
        completion_rate: 0,
        average_scores: {},
        response_distribution: {},
        generated_at: new Date().toISOString(),
      };
      return reply.code(200).send(mockSummary);
    },
  );

  // Get trend analysis
  fastify.get(
    '/analytics/trends',
    {
      schema: {
        description: 'Get trend analysis for surveys',
        tags: ['analytics'],
        querystring: TrendsQuerySchema,
        response: {
          200: TrendsResponseSchema,
        },
      },
      preHandler: [validateQuery(TrendsQuerySchema)],
    },
    async (request, reply) => {
      const { period } = request.query as any;
      // TODO: Implement analytics service
      const mockTrends = {
        period,
        data_points: [],
        trend: 'stable' as const,
        change_percentage: 0,
      };
      return reply.code(200).send(mockTrends);
    },
  );
};
