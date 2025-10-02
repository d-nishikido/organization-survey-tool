import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { SurveyService } from '../services/survey.service';
import {
  CreateSurveySchema,
  UpdateSurveySchema,
  SurveyQuerySchema,
  SurveyResponseSchema,
  SurveyListSchema,
} from '../types/survey.types';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { z } from 'zod';

const ParamsSchema = z.object({
  id: z.coerce.number().positive(),
});

export const surveysRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const surveyService = new SurveyService();

  // Get all surveys
  fastify.get(
    '/surveys',
{},
    async (request, reply) => {
      try {
        const query = request.query as z.infer<typeof SurveyQuerySchema>;
        const result = await surveyService.getAllSurveys(query);
        return reply.code(200).send(result);
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
          },
        });
      }
    },
  );

  // Get single survey
  fastify.get(
    '/surveys/:id',
    async (request, reply) => {
      try {
        const { id } = request.params as { id: number };
        const survey = await surveyService.getSurveyById(id);

        if (!survey) {
          return reply.code(404).send({
            error: {
              code: 'NOT_FOUND',
              message: `Survey with id ${id} not found`,
            },
          });
        }

        // Fix: Wrap response in 'data' property for consistency with frontend expectations
        return reply.code(200).send({ data: survey });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
          },
        });
      }
    },
  );

  // Create survey (Admin only)
  fastify.post(
    '/surveys',
    {
      preHandler: [validateBody(CreateSurveySchema)],
    },
    async (request, reply) => {
      try {
        const surveyData = request.body as z.infer<typeof CreateSurveySchema>;

        // Validate date range
        const startDate = new Date(surveyData.start_date);
        const endDate = new Date(surveyData.end_date);

        if (endDate <= startDate) {
          return reply.code(400).send({
            error: {
              code: 'INVALID_DATE_RANGE',
              message: 'End date must be after start date',
            },
          });
        }

        const survey = await surveyService.createSurvey(surveyData);
        // Fix: Wrap response in 'data' property for consistency
        return reply.code(201).send({ data: survey });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
          },
        });
      }
    },
  );

  // Update survey (Admin only)
  fastify.put(
    '/surveys/:id',
    {
      preHandler: [validateParams(ParamsSchema), validateBody(UpdateSurveySchema)],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: number };
        const updateData = request.body as z.infer<typeof UpdateSurveySchema>;

        // Validate date range if both dates are provided
        if (updateData.start_date && updateData.end_date) {
          const startDate = new Date(updateData.start_date);
          const endDate = new Date(updateData.end_date);

          if (endDate <= startDate) {
            return reply.code(400).send({
              error: {
                code: 'INVALID_DATE_RANGE',
                message: 'End date must be after start date',
              },
            });
          }
        }

        const survey = await surveyService.updateSurvey(id, updateData);

        if (!survey) {
          return reply.code(404).send({
            error: {
              code: 'NOT_FOUND',
              message: `Survey with id ${id} not found`,
            },
          });
        }

        // Fix: Wrap response in 'data' property for consistency
        return reply.code(200).send({ data: survey });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
          },
        });
      }
    },
  );

  // Delete survey (Admin only - draft surveys only)
  fastify.delete(
    '/surveys/:id',
    async (request, reply) => {
      try {
        const { id } = request.params as { id: number };

        // Check if survey exists and get its status
        const survey = await surveyService.getSurveyById(id);
        if (!survey) {
          return reply.code(404).send({
            error: {
              code: 'NOT_FOUND',
              message: `Survey with id ${id} not found`,
            },
          });
        }

        // Only allow deletion of draft surveys
        if (survey.status !== 'draft') {
          return reply.code(400).send({
            error: {
              code: 'INVALID_STATUS',
              message: 'Only draft surveys can be deleted',
            },
          });
        }

        await surveyService.deleteSurvey(id);
        return reply.code(204).send();
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
          },
        });
      }
    },
  );

  // Get questions for a specific survey
  fastify.get(
    '/surveys/:id/questions',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'number' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: { type: 'array' }
            }
          }
        }
      },
      preHandler: [validateParams(ParamsSchema)]
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: number };

        // Check if survey exists
        const surveyExists = await surveyService.surveyExists(id);
        if (!surveyExists) {
          return reply.code(404).send({
            error: {
              code: 'NOT_FOUND',
              message: `Survey with id ${id} not found`,
            },
          });
        }

        const questions = await surveyService.getSurveyQuestions(id);
        return reply.code(200).send({ data: questions });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
          },
        });
      }
    },
  );

  // Assign question to survey
  fastify.post(
    '/surveys/:id/questions',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'number' }
          }
        },
        body: {
          type: 'object',
          properties: {
            question_id: { type: 'number' },
            question_order: { type: 'number' }
          },
          required: ['question_id']
        }
      },
      preHandler: [validateParams(ParamsSchema)]
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: number };
        const { question_id, question_order } = request.body as { question_id: number; question_order?: number };

        // Check if survey exists
        const surveyExists = await surveyService.surveyExists(id);
        if (!surveyExists) {
          return reply.code(404).send({
            error: {
              code: 'NOT_FOUND',
              message: `Survey with id ${id} not found`,
            },
          });
        }

        await surveyService.assignQuestionToSurvey(id, question_id, question_order);
        return reply.code(201).send({ message: 'Question assigned successfully' });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
          },
        });
      }
    },
  );

  // Update question order in survey
  fastify.put(
    '/surveys/:id/questions/order',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'number' }
          }
        },
        body: {
          type: 'object',
          properties: {
            questions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  question_id: { type: 'number' },
                  question_order: { type: 'number' }
                },
                required: ['question_id', 'question_order']
              }
            }
          },
          required: ['questions']
        }
      },
      preHandler: [validateParams(ParamsSchema)]
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: number };
        const { questions } = request.body as { questions: { question_id: number; question_order: number }[] };

        // Check if survey exists
        const surveyExists = await surveyService.surveyExists(id);
        if (!surveyExists) {
          return reply.code(404).send({
            error: {
              code: 'NOT_FOUND',
              message: `Survey with id ${id} not found`,
            },
          });
        }

        await surveyService.updateQuestionOrder(id, questions);
        return reply.code(200).send({ message: 'Question order updated successfully' });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
          },
        });
      }
    },
  );

  // Remove question from survey
  fastify.delete(
    '/surveys/:id/questions/:questionId',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            questionId: { type: 'number' }
          }
        }
      },
      preHandler: [validateParams(z.object({
        id: z.coerce.number().positive(),
        questionId: z.coerce.number().positive()
      }))]
    },
    async (request, reply) => {
      try {
        const { id, questionId } = request.params as { id: number; questionId: number };

        // Check if survey exists
        const surveyExists = await surveyService.surveyExists(id);
        if (!surveyExists) {
          return reply.code(404).send({
            error: {
              code: 'NOT_FOUND',
              message: `Survey with id ${id} not found`,
            },
          });
        }

        await surveyService.removeQuestionFromSurvey(id, questionId);
        return reply.code(204).send();
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error',
          },
        });
      }
    },
  );
};