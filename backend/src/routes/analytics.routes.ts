import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { validateQuery } from '../middleware/validation';
import { serviceContainer } from '../services/service-container';
import { ReportRequest } from '../types/reports';

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

const ReportRequestSchema = z.object({
  surveyId: z.number().positive(),
  format: z.enum(['pdf', 'excel', 'csv']),
  template: z.enum(['summary', 'comparison', 'trends', 'detailed']),
  options: z.object({
    includeRawData: z.boolean().optional(),
    includeCharts: z.boolean().optional(),
    dateRange: z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).optional(),
    categories: z.array(z.string()).optional(),
  }).optional(),
});

const ReportJobSchema = z.object({
  id: z.string(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  createdAt: z.string(),
  completedAt: z.string().optional(),
  downloadUrl: z.string().optional(),
  error: z.string().optional(),
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

  // Generate report
  fastify.post(
    '/analytics/reports/generate',
    {
      schema: {
        description: 'Generate a report for analytics data',
        tags: ['analytics', 'reports'],
        body: ReportRequestSchema,
        response: {
          200: z.object({
            reportId: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        const reportRequest = request.body as ReportRequest;
        const reportService = serviceContainer.getReportService();
        
        const { reportId } = await reportService.generateReport(reportRequest);
        return reply.code(200).send({ reportId });
      } catch (error: any) {
        return reply.code(500).send({
          error: {
            code: 'REPORT_ERROR',
            message: 'Failed to generate report',
          },
        });
      }
    },
  );

  // Get report status
  fastify.get(
    '/analytics/reports/:reportId/status',
    {
      schema: {
        description: 'Get the status of a report generation job',
        tags: ['analytics', 'reports'],
        params: z.object({
          reportId: z.string(),
        }),
        response: {
          200: ReportJobSchema,
          404: z.object({
            error: z.object({
              code: z.string(),
              message: z.string(),
            }),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        const { reportId } = request.params as { reportId: string };
        const reportService = serviceContainer.getReportService();
        
        const job = reportService.getReportStatus(reportId);
        if (!job) {
          return reply.code(404).send({
            error: {
              code: 'REPORT_NOT_FOUND',
              message: 'Report not found',
            },
          });
        }

        return reply.code(200).send({
          id: job.id,
          status: job.status,
          createdAt: job.createdAt.toISOString(),
          completedAt: job.completedAt?.toISOString(),
          downloadUrl: job.downloadUrl,
          error: job.error,
        });
      } catch (error: any) {
        return reply.code(500).send({
          error: {
            code: 'REPORT_ERROR',
            message: 'Failed to get report status',
          },
        });
      }
    },
  );

  // Download report
  fastify.get(
    '/analytics/reports/:reportId/download',
    {
      schema: {
        description: 'Download a completed report',
        tags: ['analytics', 'reports'],
        params: z.object({
          reportId: z.string(),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { reportId } = request.params as { reportId: string };
        const reportService = serviceContainer.getReportService();
        
        const fileBuffer = await reportService.downloadReport(reportId);
        if (!fileBuffer) {
          return reply.code(404).send({
            error: {
              code: 'REPORT_NOT_FOUND',
              message: 'Report not found or not ready for download',
            },
          });
        }

        const job = reportService.getReportStatus(reportId);
        const format = job?.request.format || 'pdf';
        const mimeType = format === 'pdf' ? 'application/pdf' : 
                        format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                        'text/csv';
        
        reply.header('Content-Type', mimeType);
        reply.header('Content-Disposition', `attachment; filename="report.${format === 'excel' ? 'xlsx' : format}"`);
        return reply.send(fileBuffer);
      } catch (error: any) {
        return reply.code(500).send({
          error: {
            code: 'REPORT_ERROR',
            message: 'Failed to download report',
          },
        });
      }
    },
  );
};
