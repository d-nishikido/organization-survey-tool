import { FastifyInstance, FastifyPluginAsync } from 'fastify';
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
      // TODO: Implement question service
      const mockData = {
        data: [],
        total: 0,
        page: 1,
        pageSize: 10,
      };
      return reply.code(200).send(mockData);
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
      const { id } = request.params as { id: number };
      // TODO: Implement question service
      return reply.code(404).send({
        error: {
          code: 'NOT_FOUND',
          message: `Question with id ${id} not found`,
        },
      });
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
        },
      },
      preHandler: [validateBody(CreateQuestionSchema)],
    },
    async (request, reply) => {
      const questionData = request.body;
      // TODO: Implement question service
      const mockResponse = {
        id: 1,
        ...questionData,
        options: questionData.options || null,
        min_value: questionData.min_value || null,
        max_value: questionData.max_value || null,
        min_label: questionData.min_label || null,
        max_label: questionData.max_label || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return reply.code(201).send(mockResponse);
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
        },
      },
      preHandler: [validateParams(ParamsSchema), validateBody(UpdateQuestionSchema)],
    },
    async (request, reply) => {
      const { id } = request.params as { id: number };
      const updateData = request.body;
      // TODO: Implement question service
      return reply.code(404).send({
        error: {
          code: 'NOT_FOUND',
          message: `Question with id ${id} not found`,
        },
      });
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
        },
      },
      preHandler: [validateParams(ParamsSchema)],
    },
    async (request, reply) => {
      const { id } = request.params as { id: number };
      // TODO: Implement question service
      return reply.code(204).send();
    },
  );
};
