import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import {
  SubmitResponseSchema,
  ResponseProgressSchema,
  ResponseConfirmationSchema,
} from '../types/response.types';
import { validateBody, validateQuery } from '../middleware/validation';
import { anonymityMiddleware, validateAnonymousSession } from '../middleware/anonymity';
import { z } from 'zod';

const ProgressQuerySchema = z.object({
  session_id: z.string().uuid(),
  survey_id: z.coerce.number().positive(),
});

export const responsesRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Submit anonymous response
  fastify.post(
    '/responses',
    {
      schema: {
        description: 'Submit an anonymous survey response',
        tags: ['responses'],
        body: SubmitResponseSchema,
        response: {
          201: ResponseConfirmationSchema,
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
      preHandler: [
        anonymityMiddleware,
        validateBody(SubmitResponseSchema),
        validateAnonymousSession,
      ],
    },
    async (request, reply) => {
      const _responseData = request.body as any;
      // TODO: Implement response service
      const mockConfirmation = {
        success: true,
        message: 'Response submitted successfully',
        response_id: crypto.randomUUID(),
        submitted_at: new Date().toISOString(),
      };
      return reply.code(201).send(mockConfirmation);
    },
  );

  // Get response progress
  fastify.get(
    '/responses/progress',
    {
      schema: {
        description: 'Get survey response progress for a session',
        tags: ['responses'],
        querystring: ProgressQuerySchema,
        response: {
          200: ResponseProgressSchema,
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
      preHandler: [
        anonymityMiddleware,
        validateQuery(ProgressQuerySchema),
        validateAnonymousSession,
      ],
    },
    async (request, reply) => {
      const { session_id, survey_id } = request.query as any;
      // TODO: Implement response service
      const mockProgress = {
        survey_id,
        session_id,
        total_questions: 10,
        answered_questions: 0,
        progress_percentage: 0,
        last_updated: new Date().toISOString(),
      };
      return reply.code(200).send(mockProgress);
    },
  );
};
