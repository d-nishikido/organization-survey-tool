import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { OperationService } from '../services/operation.service';
import {
  StartSurveySchema,
  StopSurveySchema,
  PauseSurveySchema,
  ResumeSurveySchema,
  CreateReminderSchema,
  UpdateReminderSchema,
  SurveyOperationSchema,
  ReminderSettingsSchema,
  ParticipationStatsSchema,
} from '../types/operation.types';
import { z } from 'zod';

const ParamsSchema = z.object({
  id: z.coerce.number().positive(),
});

const ReminderParamsSchema = z.object({
  id: z.coerce.number().positive(),
  reminderId: z.coerce.number().positive(),
});

export const operationsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const operationService = new OperationService();

  // Start a survey
  fastify.post(
    '/surveys/:id/start',
    {
      schema: {
        description: 'Start a survey (Admin only)',
        tags: ['operations'],
        params: ParamsSchema,
        response: {
          200: SurveyOperationSchema,
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
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: number };
        const result = await operationService.startSurvey(id);
        return reply.code(200).send(result);
      } catch (error: any) {
        fastify.log.error(error);
        if (error.message.includes('not found')) {
          return reply.code(404).send({
            error: {
              code: 'NOT_FOUND',
              message: error.message,
            },
          });
        }
        return reply.code(500).send({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to start survey',
          },
        });
      }
    }
  );

  // Stop a survey
  fastify.post(
    '/surveys/:id/stop',
    {
      schema: {
        description: 'Stop a survey (Admin only)',
        tags: ['operations'],
        params: ParamsSchema,
        response: {
          200: SurveyOperationSchema,
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
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: number };
        const result = await operationService.stopSurvey(id);
        return reply.code(200).send(result);
      } catch (error: any) {
        fastify.log.error(error);
        if (error.message.includes('not found')) {
          return reply.code(404).send({
            error: {
              code: 'NOT_FOUND',
              message: error.message,
            },
          });
        }
        return reply.code(500).send({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to stop survey',
          },
        });
      }
    }
  );

  // Pause a survey
  fastify.post(
    '/surveys/:id/pause',
    {
      schema: {
        description: 'Pause an active survey (Admin only)',
        tags: ['operations'],
        params: ParamsSchema,
        response: {
          200: SurveyOperationSchema,
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
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: number };
        const result = await operationService.pauseSurvey(id);
        return reply.code(200).send(result);
      } catch (error: any) {
        fastify.log.error(error);
        if (error.message.includes('not found')) {
          return reply.code(404).send({
            error: {
              code: 'NOT_FOUND',
              message: error.message,
            },
          });
        }
        return reply.code(500).send({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to pause survey',
          },
        });
      }
    }
  );

  // Resume a paused survey
  fastify.post(
    '/surveys/:id/resume',
    {
      schema: {
        description: 'Resume a paused survey (Admin only)',
        tags: ['operations'],
        params: ParamsSchema,
        response: {
          200: SurveyOperationSchema,
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
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: number };
        const result = await operationService.resumeSurvey(id);
        return reply.code(200).send(result);
      } catch (error: any) {
        fastify.log.error(error);
        if (error.message.includes('not found')) {
          return reply.code(404).send({
            error: {
              code: 'NOT_FOUND',
              message: error.message,
            },
          });
        }
        return reply.code(500).send({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to resume survey',
          },
        });
      }
    }
  );

  // Create a reminder for a survey
  fastify.post(
    '/surveys/:id/reminders',
    {
      schema: {
        description: 'Create a reminder for a survey (Admin only)',
        tags: ['operations'],
        params: ParamsSchema,
        body: CreateReminderSchema,
        response: {
          201: ReminderSettingsSchema,
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
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: number };
        const reminderData = request.body as z.infer<typeof CreateReminderSchema>;

        // Ensure survey ID matches
        if (reminderData.surveyId !== id) {
          return reply.code(400).send({
            error: {
              code: 'INVALID_REQUEST',
              message: 'Survey ID in URL does not match survey ID in request body',
            },
          });
        }

        const result = await operationService.createReminder(reminderData);
        return reply.code(201).send(result);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create reminder',
          },
        });
      }
    }
  );

  // Get all reminders for a survey
  fastify.get(
    '/surveys/:id/reminders',
    {
      schema: {
        description: 'Get all reminders for a survey',
        tags: ['operations'],
        params: ParamsSchema,
        response: {
          200: {
            type: 'array',
            items: ReminderSettingsSchema,
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: number };
        const reminders = await operationService.getSurveyReminders(id);
        return reply.code(200).send(reminders);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to get reminders',
          },
        });
      }
    }
  );

  // Update a reminder
  fastify.put(
    '/surveys/:id/reminders/:reminderId',
    {
      schema: {
        description: 'Update a reminder (Admin only)',
        tags: ['operations'],
        params: ReminderParamsSchema,
        body: UpdateReminderSchema,
        response: {
          200: ReminderSettingsSchema,
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
    },
    async (request, reply) => {
      try {
        const { reminderId } = request.params as { id: number; reminderId: number };
        const updateData = request.body as z.infer<typeof UpdateReminderSchema>;

        const result = await operationService.updateReminder(reminderId, updateData);

        if (!result) {
          return reply.code(404).send({
            error: {
              code: 'NOT_FOUND',
              message: `Reminder with id ${reminderId} not found`,
            },
          });
        }

        return reply.code(200).send(result);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to update reminder',
          },
        });
      }
    }
  );

  // Delete a reminder
  fastify.delete(
    '/surveys/:id/reminders/:reminderId',
    {
      schema: {
        description: 'Delete a reminder (Admin only)',
        tags: ['operations'],
        params: ReminderParamsSchema,
        response: {
          204: {
            type: 'null',
            description: 'Reminder deleted successfully',
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
    },
    async (request, reply) => {
      try {
        const { reminderId } = request.params as { id: number; reminderId: number };

        const deleted = await operationService.deleteReminder(reminderId);

        if (!deleted) {
          return reply.code(404).send({
            error: {
              code: 'NOT_FOUND',
              message: `Reminder with id ${reminderId} not found`,
            },
          });
        }

        return reply.code(204).send();
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to delete reminder',
          },
        });
      }
    }
  );

  // Get participation statistics for a survey
  fastify.get(
    '/surveys/:id/participation',
    {
      schema: {
        description: 'Get participation statistics for a survey',
        tags: ['operations'],
        params: ParamsSchema,
        response: {
          200: ParticipationStatsSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: number };
        const stats = await operationService.getParticipationStats(id);
        return reply.code(200).send(stats);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to get participation statistics',
          },
        });
      }
    }
  );

  // Get operation logs for a survey
  fastify.get(
    '/surveys/:id/logs',
    {
      schema: {
        description: 'Get operation logs for a survey (Admin only)',
        tags: ['operations'],
        params: ParamsSchema,
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                survey_id: { type: 'number' },
                action: { type: 'string' },
                performed_at: { type: 'string' },
                performed_by: { type: 'string', nullable: true },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: number };
        const logs = await operationService.getSurveyOperationLogs(id);
        return reply.code(200).send(logs);
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to get operation logs',
          },
        });
      }
    }
  );
};