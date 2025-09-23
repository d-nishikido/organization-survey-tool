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
      try {
        const { serviceContainer } = require('../services/service-container');
        const responseService = serviceContainer.getResponseService();
        
        const responseData = request.body as any;
        const confirmation = await responseService.submitResponse(responseData);
        
        return reply.code(201).send(confirmation);
      } catch (error) {
        fastify.log.error(`Failed to submit response: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return reply.code(400).send({
          error: {
            code: 'SUBMISSION_FAILED',
            message: error instanceof Error ? error.message : 'Failed to submit response',
          },
        });
      }
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
      try {
        const { serviceContainer } = require('../services/service-container');
        const responseService = serviceContainer.getResponseService();
        
        const { session_id, survey_id } = request.query as any;
        const progress = await responseService.getProgress(session_id, survey_id);
        
        return reply.code(200).send(progress);
      } catch (error) {
        fastify.log.error(`Failed to get progress: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return reply.code(404).send({
          error: {
            code: 'PROGRESS_NOT_FOUND',
            message: error instanceof Error ? error.message : 'Progress not found',
          },
        });
      }
    },
  );

  // Create new session
  fastify.post(
    '/responses/session',
    {
      schema: {
        description: 'Create a new anonymous session for survey response',
        tags: ['responses'],
        body: z.object({
          survey_id: z.number().positive(),
        }),
        response: {
          201: z.object({
            session_token: z.string(),
            expires_at: z.string(),
            survey_id: z.number(),
          }),
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
      preHandler: [anonymityMiddleware],
    },
    async (request, reply) => {
      try {
        const { serviceContainer } = require('../services/service-container');
        const sessionService = serviceContainer.getSessionService();
        
        const { survey_id } = request.body as any;
        const ipAddress = request.ip || 'unknown';
        const userAgent = request.headers['user-agent'] || 'unknown';
        
        const sessionData = await sessionService.createSession(survey_id, ipAddress, userAgent);
        
        if (sessionData.isLocked) {
          return reply.code(400).send({
            error: {
              code: 'SESSION_LOCKED',
              message: sessionData.lockedReason || 'Session is locked',
            },
          });
        }
        
        return reply.code(201).send({
          session_token: sessionData.sessionToken,
          expires_at: sessionData.expiresAt.toISOString(),
          survey_id: sessionData.surveyId,
        });
      } catch (error) {
        fastify.log.error(`Failed to create session: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return reply.code(400).send({
          error: {
            code: 'SESSION_CREATION_FAILED',
            message: error instanceof Error ? error.message : 'Failed to create session',
          },
        });
      }
    },
  );

  // Complete session
  fastify.post(
    '/responses/complete',
    {
      schema: {
        description: 'Mark survey response as completed',
        tags: ['responses'],
        body: z.object({
          survey_id: z.number().positive(),
          session_id: z.string().uuid(),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
            message: z.string(),
            completed_at: z.string(),
          }),
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
        validateAnonymousSession,
      ],
    },
    async (request, reply) => {
      try {
        const { serviceContainer } = require('../services/service-container');
        const responseService = serviceContainer.getResponseService();
        
        const { survey_id, session_id } = request.body as any;
        
        await responseService.completeSession(session_id, survey_id);
        
        return reply.code(200).send({
          success: true,
          message: 'Survey completed successfully',
          completed_at: new Date().toISOString(),
        });
      } catch (error) {
        fastify.log.error(`Failed to complete session: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return reply.code(400).send({
          error: {
            code: 'COMPLETION_FAILED',
            message: error instanceof Error ? error.message : 'Failed to complete session',
          },
        });
      }
    },
  );
};;
