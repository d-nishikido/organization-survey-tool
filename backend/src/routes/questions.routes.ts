import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { QuestionService } from '../services/question.service';
import {
  CreateQuestionSchema,
  UpdateQuestionSchema,
  QuestionQuerySchema,
  QuestionResponseSchema,
  QuestionListSchema,
} from '../types/question.types';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { z } from 'zod';

const ParamsSchema = z.object({
  id: z.coerce.number().positive(),
});

export const questionsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const questionService = new QuestionService();

  // Get all questions
  fastify.get(
    '/questions',
    {
      schema: {
        description: 'Get all questions with pagination and filtering',
        tags: ['questions'],
        querystring: QuestionQuerySchema,
        response: {
          200: QuestionListSchema,
        },
      },
      preHandler: [validateQuery(QuestionQuerySchema)],
    },
    async (request, reply) => {
      try {
        const query = request.query as z.infer<typeof QuestionQuerySchema>;
        const result = await questionService.getAllQuestions(query);
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

  // Get single question
  fastify.get(
    '/questions/:id',
    {
      schema: {
        description: 'Get a specific question by ID',
        tags: ['questions'],
        params: ParamsSchema,
        response: {
          200: QuestionResponseSchema,
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
      preHandler: [validateParams(ParamsSchema)],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: number };
        const question = await questionService.getQuestionById(id);

        if (!question) {
          return reply.code(404).send({
            error: {
              code: 'NOT_FOUND',
              message: `Question with id ${id} not found`,
            },
          });
        }

        return reply.code(200).send(question);
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

  // Create question (Admin only)
  fastify.post(
    '/questions',
    {
      schema: {
        description: 'Create a new question (Admin only)',
        tags: ['questions'],
        body: CreateQuestionSchema,
        response: {
          201: QuestionResponseSchema,
          400: {
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
      preHandler: [validateBody(CreateQuestionSchema)],
    },
    async (request, reply) => {
      try {
        const questionData = request.body as z.infer<typeof CreateQuestionSchema>;

        // Validate rating scale ranges
        if (questionData.type === 'rating' || questionData.type === 'scale') {
          if (questionData.min_value !== undefined && questionData.max_value !== undefined) {
            if (questionData.max_value <= questionData.min_value) {
              return reply.code(400).send({
                error: {
                  code: 'INVALID_RANGE',
                  message: 'Max value must be greater than min value',
                },
              });
            }
          }
        }

        const question = await questionService.createQuestion(questionData);
        return reply.code(201).send(question);
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

  // Update question (Admin only)
  fastify.put(
    '/questions/:id',
    {
      schema: {
        description: 'Update an existing question (Admin only)',
        tags: ['questions'],
        params: ParamsSchema,
        body: UpdateQuestionSchema,
        response: {
          200: QuestionResponseSchema,
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
      preHandler: [validateParams(ParamsSchema), validateBody(UpdateQuestionSchema)],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: number };
        const updateData = request.body as z.infer<typeof UpdateQuestionSchema>;

        // Validate rating scale ranges if provided
        if (updateData.min_value !== undefined && updateData.max_value !== undefined) {
          if (updateData.max_value <= updateData.min_value) {
            return reply.code(400).send({
              error: {
                code: 'INVALID_RANGE',
                message: 'Max value must be greater than min value',
              },
            });
          }
        }

        const question = await questionService.updateQuestion(id, updateData);

        if (!question) {
          return reply.code(404).send({
            error: {
              code: 'NOT_FOUND',
              message: `Question with id ${id} not found`,
            },
          });
        }

        return reply.code(200).send(question);
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

  // Delete question (Admin only)
  fastify.delete(
    '/questions/:id',
    {
      schema: {
        description: 'Delete a question (Admin only)',
        tags: ['questions'],
        params: ParamsSchema,
        response: {
          204: {
            type: 'null',
            description: 'Question deleted successfully',
          },
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
      preHandler: [validateParams(ParamsSchema)],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: number };

        const exists = await questionService.questionExists(id);
        if (!exists) {
          return reply.code(404).send({
            error: {
              code: 'NOT_FOUND',
              message: `Question with id ${id} not found`,
            },
          });
        }

        await questionService.deleteQuestion(id);
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
