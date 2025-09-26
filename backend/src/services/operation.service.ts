import { db } from '../config/database';
import { logger } from '../utils/logger';
import { db } from '../config/database';
import type {
  SurveyOperation,
  SurveyOperationStatus,
  ReminderSettings,
  CreateReminderDto,
  UpdateReminderDto,
  ParticipationStats,
  DepartmentStats,
  DailyProgress,
} from '../types/operation.types';

export class OperationService {
  /**
   * Start a survey
   */
  async startSurvey(surveyId: number): Promise<SurveyOperation> {
    try {
      const now = new Date().toISOString();

      // Update survey status to active
      const result = await db.query(
        `UPDATE surveys
         SET status = $1, updated_at = $2
         WHERE id = $3
         RETURNING *`,
        ['active', now, surveyId]
      );

      if (!result || result.length === 0) {
        throw new Error(`Survey with id ${surveyId} not found`);
      }

      // Log the operation
      await db.query(
        `INSERT INTO survey_operation_logs (survey_id, action, performed_at)
         VALUES ($1, $2, $3)`,
        [surveyId, 'started', now]
      );

      return {
        surveyId,
        status: 'active',
        startedAt: now,
      };
    } catch (error) {
      logger.error('Error starting survey:', error);
      throw error;
    }
  }

  /**
   * Stop a survey
   */
  async stopSurvey(surveyId: number): Promise<SurveyOperation> {
    try {
      const now = new Date().toISOString();

      // Update survey status to closed
      const result = await db.query(
        `UPDATE surveys
         SET status = $1, updated_at = $2
         WHERE id = $3
         RETURNING *`,
        ['closed', now, surveyId]
      );

      if (!result || result.length === 0) {
        throw new Error(`Survey with id ${surveyId} not found`);
      }

      // Log the operation
      await db.query(
        `INSERT INTO survey_operation_logs (survey_id, action, performed_at)
         VALUES ($1, $2, $3)`,
        [surveyId, 'stopped', now]
      );

      return {
        surveyId,
        status: 'closed',
        stoppedAt: now,
      };
    } catch (error) {
      logger.error('Error stopping survey:', error);
      throw error;
    }
  }

  /**
   * Pause a survey
   */
  async pauseSurvey(surveyId: number): Promise<SurveyOperation> {
    try {
      const now = new Date().toISOString();

      // Update survey status to paused
      const result = await db.query(
        `UPDATE surveys
         SET status = $1, updated_at = $2
         WHERE id = $3 AND status = 'active'
         RETURNING *`,
        ['paused', now, surveyId]
      );

      if (!result || result.length === 0) {
        throw new Error(`Active survey with id ${surveyId} not found`);
      }

      // Log the operation
      await db.query(
        `INSERT INTO survey_operation_logs (survey_id, action, performed_at)
         VALUES ($1, $2, $3)`,
        [surveyId, 'paused', now]
      );

      return {
        surveyId,
        status: 'paused',
        pausedAt: now,
      };
    } catch (error) {
      logger.error('Error pausing survey:', error);
      throw error;
    }
  }

  /**
   * Resume a paused survey
   */
  async resumeSurvey(surveyId: number): Promise<SurveyOperation> {
    try {
      const now = new Date().toISOString();

      // Update survey status back to active
      const result = await db.query(
        `UPDATE surveys
         SET status = $1, updated_at = $2
         WHERE id = $3 AND status = 'paused'
         RETURNING *`,
        ['active', now, surveyId]
      );

      if (!result || result.length === 0) {
        throw new Error(`Paused survey with id ${surveyId} not found`);
      }

      // Log the operation
      await db.query(
        `INSERT INTO survey_operation_logs (survey_id, action, performed_at)
         VALUES ($1, $2, $3)`,
        [surveyId, 'resumed', now]
      );

      return {
        surveyId,
        status: 'active',
        startedAt: now,
      };
    } catch (error) {
      logger.error('Error resuming survey:', error);
      throw error;
    }
  }

  /**
   * Create a reminder for a survey
   */
  async createReminder(data: CreateReminderDto): Promise<ReminderSettings> {
    try {
      const result = await db.query(
        `INSERT INTO survey_reminders
         (survey_id, frequency, schedule_time, message, target_groups, enabled, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          data.surveyId,
          data.frequency,
          data.scheduleTime,
          data.message,
          JSON.stringify(data.targetGroups || []),
          data.enabled ?? true,
          new Date().toISOString(),
          new Date().toISOString(),
        ]
      );

      if (!result || result.length === 0) {
        throw new Error('Failed to create reminder');
      }

      const reminder = result[0];
      return {
        id: reminder.id,
        surveyId: reminder.survey_id,
        frequency: reminder.frequency,
        scheduleTime: reminder.schedule_time,
        message: reminder.message,
        targetGroups: JSON.parse(reminder.target_groups),
        enabled: reminder.enabled,
      };
    } catch (error) {
      logger.error('Error creating reminder:', error);
      throw error;
    }
  }

  /**
   * Update a reminder
   */
  async updateReminder(id: number, data: UpdateReminderDto): Promise<ReminderSettings | null> {
    try {
      const updates: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (data.frequency !== undefined) {
        updates.push(`frequency = $${paramCount}`);
        values.push(data.frequency);
        paramCount++;
      }

      if (data.scheduleTime !== undefined) {
        updates.push(`schedule_time = $${paramCount}`);
        values.push(data.scheduleTime);
        paramCount++;
      }

      if (data.message !== undefined) {
        updates.push(`message = $${paramCount}`);
        values.push(data.message);
        paramCount++;
      }

      if (data.targetGroups !== undefined) {
        updates.push(`target_groups = $${paramCount}`);
        values.push(JSON.stringify(data.targetGroups));
        paramCount++;
      }

      if (data.enabled !== undefined) {
        updates.push(`enabled = $${paramCount}`);
        values.push(data.enabled);
        paramCount++;
      }

      updates.push(`updated_at = $${paramCount}`);
      values.push(new Date().toISOString());
      paramCount++;

      values.push(id);

      const result = await db.query(
        `UPDATE survey_reminders
         SET ${updates.join(', ')}
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      );

      if (!result || result.length === 0) {
        return null;
      }

      const reminder = result[0];
      return {
        id: reminder.id,
        surveyId: reminder.survey_id,
        frequency: reminder.frequency,
        scheduleTime: reminder.schedule_time,
        message: reminder.message,
        targetGroups: JSON.parse(reminder.target_groups),
        enabled: reminder.enabled,
      };
    } catch (error) {
      logger.error('Error updating reminder:', error);
      throw error;
    }
  }

  /**
   * Get reminders for a survey
   */
  async getSurveyReminders(surveyId: number): Promise<ReminderSettings[]> {
    try {
      const result = await db.query(
        `SELECT * FROM survey_reminders WHERE survey_id = $1 ORDER BY created_at DESC`,
        [surveyId]
      );

      return result.map((reminder: any) => ({
        id: reminder.id,
        surveyId: reminder.survey_id,
        frequency: reminder.frequency,
        scheduleTime: reminder.schedule_time,
        message: reminder.message,
        targetGroups: JSON.parse(reminder.target_groups),
        enabled: reminder.enabled,
      }));
    } catch (error) {
      logger.error('Error getting survey reminders:', error);
      throw error;
    }
  }

  /**
   * Delete a reminder
   */
  async deleteReminder(id: number): Promise<boolean> {
    try {
      const result = await db.query(
        `DELETE FROM survey_reminders WHERE id = $1`,
        [id]
      );

      return result && result.length > 0;
    } catch (error) {
      logger.error('Error deleting reminder:', error);
      throw error;
    }
  }

  /**
   * Get participation statistics for a survey
   */
  async getParticipationStats(surveyId: number): Promise<ParticipationStats> {
    try {
      // Get total responses
      const responseResult = await db.query(
        `SELECT COUNT(DISTINCT session_id) as total_responses
         FROM survey_responses
         WHERE survey_id = $1`,
        [surveyId]
      );

      const totalResponses = parseInt(responseResult[0]?.total_responses || '0');

      // Mock total employees (in real implementation, this would come from HR system)
      const totalEmployees = 1000;

      // Get responses by department (mock data for now)
      const departments: DepartmentStats[] = [
        { department: '営業部', totalEmployees: 300, responses: Math.floor(totalResponses * 0.3), responseRate: 0 },
        { department: '開発部', totalEmployees: 400, responses: Math.floor(totalResponses * 0.4), responseRate: 0 },
        { department: '管理部', totalEmployees: 200, responses: Math.floor(totalResponses * 0.2), responseRate: 0 },
        { department: 'その他', totalEmployees: 100, responses: Math.floor(totalResponses * 0.1), responseRate: 0 },
      ];

      // Calculate response rates
      departments.forEach(dept => {
        dept.responseRate = (dept.responses / dept.totalEmployees) * 100;
      });

      // Get daily progress
      const dailyResult = await db.query(
        `SELECT
          DATE(created_at) as date,
          COUNT(DISTINCT session_id) as daily_responses
         FROM survey_responses
         WHERE survey_id = $1
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at)`,
        [surveyId]
      );

      let cumulativeResponses = 0;
      const dailyProgress: DailyProgress[] = dailyResult.map((row: any) => {
        cumulativeResponses += parseInt(row.daily_responses);
        return {
          date: row.date,
          responses: parseInt(row.daily_responses),
          cumulativeResponses,
        };
      });

      return {
        totalEmployees,
        totalResponses,
        responseRate: (totalResponses / totalEmployees) * 100,
        byDepartment: departments,
        dailyProgress,
      };
    } catch (error) {
      logger.error('Error getting participation stats:', error);
      throw error;
    }
  }

  /**
   * Get operation logs for a survey
   */
  async getSurveyOperationLogs(surveyId: number): Promise<any[]> {
    try {
      const result = await db.query(
        `SELECT * FROM survey_operation_logs
         WHERE survey_id = $1
         ORDER BY performed_at DESC
         LIMIT 50`,
        [surveyId]
      );

      return result;
    } catch (error) {
      logger.error('Error getting operation logs:', error);
      throw error;
    }
  }
}