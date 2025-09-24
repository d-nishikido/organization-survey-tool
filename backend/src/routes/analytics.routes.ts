import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { validateQuery } from '../middleware/validation';
import { serviceContainer } from '../services/service-container';

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

const CategoryAnalysisResponseSchema = z.object({
  categories: z.array(
    z.object({
      category_code: z.string(),
      category_name: z.string(),
      response_count: z.number(),
      average_score: z.number(),
      statistics: z.object({
        mean: z.number(),
        median: z.number(),
        standardDeviation: z.number(),
        variance: z.number(),
        min: z.number(),
        max: z.number(),
        count: z.number(),
        quartiles: z.object({
          q1: z.number(),
          q2: z.number(),
          q3: z.number(),
        }),
      }),
      distribution: z.array(
        z.object({
          range: z.string(),
          count: z.number(),
          percentage: z.number(),
        })
      ),
    })
  ),
});

const CategoryQuerySchema = z.object({
  survey_id: z.coerce.number().positive(),
  category: z.string().optional(),
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
      try {
        const { survey_id } = request.query as any;
        const analyticsService = serviceContainer.getAnalyticsService();

        const summary = await analyticsService.getSurveySummary(survey_id);
        return reply.code(200).send(summary);
      } catch (error: any) {
        if (error.message.includes('not found')) {
          return reply.code(404).send({
            error: {
              code: 'SURVEY_NOT_FOUND',
              message: 'Survey not found',
            },
          });
        }

        return reply.code(500).send({
          error: {
            code: 'ANALYTICS_ERROR',
            message: 'Failed to generate analytics summary',
          },
        });
      }
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
      try {
        const { survey_id, category, period } = request.query as any;
        const analyticsService = serviceContainer.getAnalyticsService();

        const trends = await analyticsService.getTrendAnalysis(survey_id, category, period);
        return reply.code(200).send(trends);
      } catch (error: any) {
        return reply.code(500).send({
          error: {
            code: 'ANALYTICS_ERROR',
            message: 'Failed to generate trend analysis',
          },
        });
      }
    },
  );

  // Get category analysis
  fastify.get(
    '/analytics/categories',
    {
      schema: {
        description: 'Get category-based analysis for a survey',
        tags: ['analytics'],
        querystring: CategoryQuerySchema,
        response: {
          200: CategoryAnalysisResponseSchema,
        },
      },
      preHandler: [validateQuery(CategoryQuerySchema)],
    },
    async (request, reply) => {
      try {
        const { survey_id, category } = request.query as any;
        const analyticsService = serviceContainer.getAnalyticsService();

        const categories = await analyticsService.getCategoryAnalysis(survey_id, category);
        return reply.code(200).send({ categories });
      } catch (error: any) {
        return reply.code(500).send({
          error: {
            code: 'ANALYTICS_ERROR',
            message: 'Failed to generate category analysis',
          },
        });
      }
    },
  );
};
