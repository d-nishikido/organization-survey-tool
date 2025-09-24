import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import Fastify from 'fastify';
import { operationsRoutes } from '../operations.routes';
import { OperationService } from '../../services/operation.service';

// Mock the OperationService
jest.mock('../../services/operation.service');

const MockOperationService = OperationService as jest.MockedClass<typeof OperationService>;

describe('Operations Routes', () => {
  let app: ReturnType<typeof Fastify>;
  let mockOperationService: jest.Mocked<OperationService>;

  beforeEach(async () => {
    app = Fastify();
    await app.register(operationsRoutes);

    mockOperationService = new MockOperationService() as jest.Mocked<OperationService>;
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /surveys/:id/start', () => {
    it('should start a survey successfully', async () => {
      const surveyId = 1;
      const mockResult = {
        surveyId,
        status: 'active' as const,
        startedAt: '2024-01-01T10:00:00Z',
      };

      mockOperationService.startSurvey = jest.fn().mockResolvedValue(mockResult);
      // Replace the service instance in the route
      (OperationService as any).prototype.startSurvey = mockOperationService.startSurvey;

      const response = await app.inject({
        method: 'POST',
        url: `/surveys/${surveyId}/start`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.surveyId).toBe(surveyId);
      expect(body.status).toBe('active');
    });

    it('should return 404 if survey not found', async () => {
      const surveyId = 999;

      mockOperationService.startSurvey = jest.fn().mockRejectedValue(
        new Error('Survey with id 999 not found')
      );
      (OperationService as any).prototype.startSurvey = mockOperationService.startSurvey;

      const response = await app.inject({
        method: 'POST',
        url: `/surveys/${surveyId}/start`,
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('POST /surveys/:id/stop', () => {
    it('should stop a survey successfully', async () => {
      const surveyId = 1;
      const mockResult = {
        surveyId,
        status: 'closed' as const,
        stoppedAt: '2024-01-01T10:00:00Z',
      };

      mockOperationService.stopSurvey = jest.fn().mockResolvedValue(mockResult);
      (OperationService as any).prototype.stopSurvey = mockOperationService.stopSurvey;

      const response = await app.inject({
        method: 'POST',
        url: `/surveys/${surveyId}/stop`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.surveyId).toBe(surveyId);
      expect(body.status).toBe('closed');
    });
  });

  describe('POST /surveys/:id/reminders', () => {
    it('should create a reminder successfully', async () => {
      const surveyId = 1;
      const reminderData = {
        surveyId,
        frequency: 'daily',
        scheduleTime: '09:00',
        message: 'Please complete the survey',
        enabled: true,
      };

      const mockResult = {
        id: 1,
        ...reminderData,
      };

      mockOperationService.createReminder = jest.fn().mockResolvedValue(mockResult);
      (OperationService as any).prototype.createReminder = mockOperationService.createReminder;

      const response = await app.inject({
        method: 'POST',
        url: `/surveys/${surveyId}/reminders`,
        payload: reminderData,
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.id).toBe(1);
      expect(body.surveyId).toBe(surveyId);
    });

    it('should return 400 if survey ID mismatch', async () => {
      const surveyId = 1;
      const reminderData = {
        surveyId: 2, // Different from URL
        frequency: 'daily',
        scheduleTime: '09:00',
        message: 'Please complete the survey',
        enabled: true,
      };

      const response = await app.inject({
        method: 'POST',
        url: `/surveys/${surveyId}/reminders`,
        payload: reminderData,
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('INVALID_REQUEST');
    });
  });

  describe('GET /surveys/:id/reminders', () => {
    it('should get all reminders for a survey', async () => {
      const surveyId = 1;
      const mockResult = [
        {
          id: 1,
          surveyId,
          frequency: 'daily' as const,
          scheduleTime: '09:00',
          message: 'Please complete the survey',
          enabled: true,
        },
      ];

      mockOperationService.getSurveyReminders = jest.fn().mockResolvedValue(mockResult);
      (OperationService as any).prototype.getSurveyReminders = mockOperationService.getSurveyReminders;

      const response = await app.inject({
        method: 'GET',
        url: `/surveys/${surveyId}/reminders`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveLength(1);
      expect(body[0].surveyId).toBe(surveyId);
    });
  });

  describe('GET /surveys/:id/participation', () => {
    it('should get participation statistics', async () => {
      const surveyId = 1;
      const mockResult = {
        totalEmployees: 1000,
        totalResponses: 50,
        responseRate: 5.0,
        byDepartment: [],
        dailyProgress: [],
      };

      mockOperationService.getParticipationStats = jest.fn().mockResolvedValue(mockResult);
      (OperationService as any).prototype.getParticipationStats = mockOperationService.getParticipationStats;

      const response = await app.inject({
        method: 'GET',
        url: `/surveys/${surveyId}/participation`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.totalEmployees).toBe(1000);
      expect(body.totalResponses).toBe(50);
      expect(body.responseRate).toBe(5.0);
    });
  });

  describe('DELETE /surveys/:id/reminders/:reminderId', () => {
    it('should delete a reminder successfully', async () => {
      const surveyId = 1;
      const reminderId = 1;

      mockOperationService.deleteReminder = jest.fn().mockResolvedValue(true);
      (OperationService as any).prototype.deleteReminder = mockOperationService.deleteReminder;

      const response = await app.inject({
        method: 'DELETE',
        url: `/surveys/${surveyId}/reminders/${reminderId}`,
      });

      expect(response.statusCode).toBe(204);
    });

    it('should return 404 if reminder not found', async () => {
      const surveyId = 1;
      const reminderId = 999;

      mockOperationService.deleteReminder = jest.fn().mockResolvedValue(false);
      (OperationService as any).prototype.deleteReminder = mockOperationService.deleteReminder;

      const response = await app.inject({
        method: 'DELETE',
        url: `/surveys/${surveyId}/reminders/${reminderId}`,
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('NOT_FOUND');
    });
  });
});