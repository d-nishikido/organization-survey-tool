import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { OperationService } from '../operation.service';
import { db } from '../../config/database';
import { logger } from '../../utils/logger';

// Mock dependencies
jest.mock('../../config/database');
jest.mock('../../utils/logger');

const mockDb = db as jest.Mocked<typeof db>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe('OperationService', () => {
  let operationService: OperationService;

  beforeEach(() => {
    operationService = new OperationService();
    jest.clearAllMocks();
  });

  describe('startSurvey', () => {
    it('should start a survey successfully', async () => {
      const surveyId = 1;
      const mockResult = [{ id: surveyId, status: 'active' }];

      mockDb.query
        .mockResolvedValueOnce(mockResult) // Update survey
        .mockResolvedValueOnce([]); // Insert log

      const result = await operationService.startSurvey(surveyId);

      expect(mockDb.query).toHaveBeenCalledTimes(2);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE surveys'),
        expect.arrayContaining(['active', expect.any(String), surveyId])
      );
      expect(result.surveyId).toBe(surveyId);
      expect(result.status).toBe('active');
      expect(result.startedAt).toBeDefined();
    });

    it('should throw error if survey not found', async () => {
      const surveyId = 999;
      mockDb.query.mockResolvedValueOnce([]);

      await expect(operationService.startSurvey(surveyId)).rejects.toThrow(
        'Survey with id 999 not found'
      );
    });
  });

  describe('stopSurvey', () => {
    it('should stop a survey successfully', async () => {
      const surveyId = 1;
      const mockResult = [{ id: surveyId, status: 'closed' }];

      mockDb.query
        .mockResolvedValueOnce(mockResult) // Update survey
        .mockResolvedValueOnce([]); // Insert log

      const result = await operationService.stopSurvey(surveyId);

      expect(mockDb.query).toHaveBeenCalledTimes(2);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE surveys'),
        expect.arrayContaining(['closed', expect.any(String), surveyId])
      );
      expect(result.surveyId).toBe(surveyId);
      expect(result.status).toBe('closed');
      expect(result.stoppedAt).toBeDefined();
    });
  });

  describe('pauseSurvey', () => {
    it('should pause an active survey successfully', async () => {
      const surveyId = 1;
      const mockResult = [{ id: surveyId, status: 'paused' }];

      mockDb.query
        .mockResolvedValueOnce(mockResult) // Update survey
        .mockResolvedValueOnce([]); // Insert log

      const result = await operationService.pauseSurvey(surveyId);

      expect(mockDb.query).toHaveBeenCalledTimes(2);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("status = 'active'"),
        expect.arrayContaining(['paused', expect.any(String), surveyId])
      );
      expect(result.surveyId).toBe(surveyId);
      expect(result.status).toBe('paused');
      expect(result.pausedAt).toBeDefined();
    });

    it('should throw error if active survey not found', async () => {
      const surveyId = 1;
      mockDb.query.mockResolvedValueOnce([]);

      await expect(operationService.pauseSurvey(surveyId)).rejects.toThrow(
        'Active survey with id 1 not found'
      );
    });
  });

  describe('resumeSurvey', () => {
    it('should resume a paused survey successfully', async () => {
      const surveyId = 1;
      const mockResult = [{ id: surveyId, status: 'active' }];

      mockDb.query
        .mockResolvedValueOnce(mockResult) // Update survey
        .mockResolvedValueOnce([]); // Insert log

      const result = await operationService.resumeSurvey(surveyId);

      expect(mockDb.query).toHaveBeenCalledTimes(2);
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining("status = 'paused'"),
        expect.arrayContaining(['active', expect.any(String), surveyId])
      );
      expect(result.surveyId).toBe(surveyId);
      expect(result.status).toBe('active');
      expect(result.startedAt).toBeDefined();
    });
  });

  describe('createReminder', () => {
    it('should create a reminder successfully', async () => {
      const reminderData = {
        surveyId: 1,
        frequency: 'daily' as const,
        scheduleTime: '09:00',
        message: 'Please complete the survey',
        enabled: true,
      };

      const mockResult = [{
        id: 1,
        survey_id: 1,
        frequency: 'daily',
        schedule_time: '09:00',
        message: 'Please complete the survey',
        target_groups: '[]',
        enabled: true,
      }];

      mockDb.query.mockResolvedValueOnce(mockResult);

      const result = await operationService.createReminder(reminderData);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO survey_reminders'),
        expect.arrayContaining([
          reminderData.surveyId,
          reminderData.frequency,
          reminderData.scheduleTime,
          reminderData.message,
          '[]',
          reminderData.enabled,
          expect.any(String),
          expect.any(String),
        ])
      );
      expect(result.id).toBe(1);
      expect(result.surveyId).toBe(reminderData.surveyId);
      expect(result.frequency).toBe(reminderData.frequency);
    });

    it('should throw error if reminder creation fails', async () => {
      const reminderData = {
        surveyId: 1,
        frequency: 'daily' as const,
        scheduleTime: '09:00',
        message: 'Please complete the survey',
        enabled: true,
      };

      mockDb.query.mockResolvedValueOnce([]);

      await expect(operationService.createReminder(reminderData)).rejects.toThrow(
        'Failed to create reminder'
      );
    });
  });

  describe('getSurveyReminders', () => {
    it('should get all reminders for a survey', async () => {
      const surveyId = 1;
      const mockResult = [{
        id: 1,
        survey_id: 1,
        frequency: 'daily',
        schedule_time: '09:00',
        message: 'Please complete the survey',
        target_groups: '[]',
        enabled: true,
      }];

      mockDb.query.mockResolvedValueOnce(mockResult);

      const result = await operationService.getSurveyReminders(surveyId);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM survey_reminders'),
        [surveyId]
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].surveyId).toBe(1);
    });
  });

  describe('updateReminder', () => {
    it('should update a reminder successfully', async () => {
      const reminderId = 1;
      const updateData = {
        message: 'Updated message',
        enabled: false,
      };

      const mockResult = [{
        id: 1,
        survey_id: 1,
        frequency: 'daily',
        schedule_time: '09:00',
        message: 'Updated message',
        target_groups: '[]',
        enabled: false,
      }];

      mockDb.query.mockResolvedValueOnce(mockResult);

      const result = await operationService.updateReminder(reminderId, updateData);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE survey_reminders'),
        expect.arrayContaining(['Updated message', false, expect.any(String), reminderId])
      );
      expect(result).not.toBeNull();
      expect(result?.message).toBe('Updated message');
      expect(result?.enabled).toBe(false);
    });

    it('should return null if reminder not found', async () => {
      const reminderId = 999;
      const updateData = { message: 'Updated message' };

      mockDb.query.mockResolvedValueOnce([]);

      const result = await operationService.updateReminder(reminderId, updateData);

      expect(result).toBeNull();
    });
  });

  describe('deleteReminder', () => {
    it('should delete a reminder successfully', async () => {
      const reminderId = 1;
      mockDb.query.mockResolvedValueOnce([{ id: 1 }]);

      const result = await operationService.deleteReminder(reminderId);

      expect(mockDb.query).toHaveBeenCalledWith(
        'DELETE FROM survey_reminders WHERE id = $1',
        [reminderId]
      );
      expect(result).toBe(true);
    });

    it('should return false if reminder not found', async () => {
      const reminderId = 999;
      mockDb.query.mockResolvedValueOnce([]);

      const result = await operationService.deleteReminder(reminderId);

      expect(result).toBe(false);
    });
  });

  describe('getParticipationStats', () => {
    it('should get participation statistics', async () => {
      const surveyId = 1;
      const mockResponseResult = [{ total_responses: '50' }];
      const mockDailyResult = [
        { date: '2024-01-01', daily_responses: '10' },
        { date: '2024-01-02', daily_responses: '15' },
      ];

      mockDb.query
        .mockResolvedValueOnce(mockResponseResult)
        .mockResolvedValueOnce(mockDailyResult);

      const result = await operationService.getParticipationStats(surveyId);

      expect(result.totalEmployees).toBe(1000);
      expect(result.totalResponses).toBe(50);
      expect(result.responseRate).toBe(5.0);
      expect(result.byDepartment).toHaveLength(4);
      expect(result.dailyProgress).toHaveLength(2);
      expect(result.dailyProgress[0].responses).toBe(10);
      expect(result.dailyProgress[0].cumulativeResponses).toBe(10);
      expect(result.dailyProgress[1].responses).toBe(15);
      expect(result.dailyProgress[1].cumulativeResponses).toBe(25);
    });
  });

  describe('getSurveyOperationLogs', () => {
    it('should get operation logs for a survey', async () => {
      const surveyId = 1;
      const mockResult = [
        { id: 1, survey_id: 1, action: 'started', performed_at: '2024-01-01T10:00:00Z' },
        { id: 2, survey_id: 1, action: 'paused', performed_at: '2024-01-01T12:00:00Z' },
      ];

      mockDb.query.mockResolvedValueOnce(mockResult);

      const result = await operationService.getSurveyOperationLogs(surveyId);

      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM survey_operation_logs'),
        [surveyId]
      );
      expect(result).toHaveLength(2);
      expect(result[0].action).toBe('started');
      expect(result[1].action).toBe('paused');
    });
  });
});