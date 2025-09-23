import { FastifyInstance, FastifyPluginAsync } from 'fastify';
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
  // Get all surveys
  fastify.get(
    '/surveys',
    {
      schema: {
        description: 'Get all surveys with pagination and filtering',
        tags: ['surveys'],
        querystring: SurveyQuerySchema,
        response: {
          200: SurveyListSchema,
        },
      },
      preHandler: [validateQuery(SurveyQuerySchema)],
    },
    async (request, reply) => {
      // TODO: Implement survey service
      const mockData = {
        data: [],
        total: 0,
        page: 1,
        pageSize: 10,
      };
      return reply.code(200).send(mockData);
    },
  );

  // Get single survey
  fastify.get(
    '/surveys/:id',
    {
      schema: {
        description: 'Get a specific survey by ID',
        tags: ['surveys'],
        params: ParamsSchema,
        response: {
          200: SurveyResponseSchema,
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
      // TODO: Implement survey service
      return reply.code(404).send({
        error: {
          code: 'NOT_FOUND',
          message: `Survey with id ${id} not found`,
        },
      });
    },
  );

  // Create survey (Admin only)
  fastify.post(
    '/surveys',
    {
      schema: {
        description: 'Create a new survey (Admin only)',
        tags: ['surveys'],
        body: CreateSurveySchema,
        response: {
          201: SurveyResponseSchema,
        },
      },
      preHandler: [validateBody(CreateSurveySchema)],
    },
    async (request, reply) => {
      const surveyData = request.body;
      // TODO: Implement survey service
      const mockResponse = {
        id: 1,
        ...surveyData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return reply.code(201).send(mockResponse);
    },
  );

  // Update survey (Admin only)
  fastify.put(
    '/surveys/:id',
    {
      schema: {
        description: 'Update an existing survey (Admin only)',
        tags: ['surveys'],
        params: ParamsSchema,
        body: UpdateSurveySchema,
        response: {
          200: SurveyResponseSchema,
        },
      },
      preHandler: [validateParams(ParamsSchema), validateBody(UpdateSurveySchema)],
    },
    async (request, reply) => {
      const { id } = request.params as { id: number };
      const updateData = request.body;
      // TODO: Implement survey service
      return reply.code(404).send({
        error: {
          code: 'NOT_FOUND',
          message: `Survey with id ${id} not found`,
        },
      });
    },
  );

  // Delete survey (Admin only)
  fastify.delete(
    '/surveys/:id',
    {
      schema: {
        description: 'Delete a survey (Admin only)',
        tags: ['surveys'],
        params: ParamsSchema,
        response: {
          204: {
            type: 'null',
            description: 'Survey deleted successfully',
          },
        },
      },
      preHandler: [validateParams(ParamsSchema)],
    },
    async (request, reply) => {
      const { id } = request.params as { id: number };
      // TODO: Implement survey service
      return reply.code(204).send();
    },
  );
};
