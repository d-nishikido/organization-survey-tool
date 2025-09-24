import { apiClient } from '../client';
import type {
  SurveyOperation,
  ReminderSettings,
  ParticipationStats,
  OperationLog,
} from '../../types/operation';

export const operationService = {
  /**
   * Start a survey
   */
  async startSurvey(surveyId: number): Promise<SurveyOperation> {
    const response = await apiClient.post<SurveyOperation>(
      `/surveys/${surveyId}/start`
    );
    return response.data;
  },

  /**
   * Stop a survey
   */
  async stopSurvey(surveyId: number): Promise<SurveyOperation> {
    const response = await apiClient.post<SurveyOperation>(
      `/surveys/${surveyId}/stop`
    );
    return response.data;
  },

  /**
   * Pause a survey
   */
  async pauseSurvey(surveyId: number): Promise<SurveyOperation> {
    const response = await apiClient.post<SurveyOperation>(
      `/surveys/${surveyId}/pause`
    );
    return response.data;
  },

  /**
   * Resume a paused survey
   */
  async resumeSurvey(surveyId: number): Promise<SurveyOperation> {
    const response = await apiClient.post<SurveyOperation>(
      `/surveys/${surveyId}/resume`
    );
    return response.data;
  },

  /**
   * Create a reminder for a survey
   */
  async createReminder(reminder: ReminderSettings): Promise<ReminderSettings> {
    const response = await apiClient.post<ReminderSettings>(
      `/surveys/${reminder.surveyId}/reminders`,
      reminder
    );
    return response.data;
  },

  /**
   * Get all reminders for a survey
   */
  async getSurveyReminders(surveyId: number): Promise<ReminderSettings[]> {
    const response = await apiClient.get<ReminderSettings[]>(
      `/surveys/${surveyId}/reminders`
    );
    return response.data;
  },

  /**
   * Update a reminder
   */
  async updateReminder(
    surveyId: number,
    reminderId: number,
    data: Partial<ReminderSettings>
  ): Promise<ReminderSettings> {
    const response = await apiClient.put<ReminderSettings>(
      `/surveys/${surveyId}/reminders/${reminderId}`,
      data
    );
    return response.data;
  },

  /**
   * Delete a reminder
   */
  async deleteReminder(surveyId: number, reminderId: number): Promise<void> {
    await apiClient.delete(`/surveys/${surveyId}/reminders/${reminderId}`);
  },

  /**
   * Get participation statistics for a survey
   */
  async getParticipationStats(surveyId: number): Promise<ParticipationStats> {
    const response = await apiClient.get<ParticipationStats>(
      `/surveys/${surveyId}/participation`
    );
    return response.data;
  },

  /**
   * Get operation logs for a survey
   */
  async getSurveyOperationLogs(surveyId: number): Promise<OperationLog[]> {
    const response = await apiClient.get<OperationLog[]>(
      `/surveys/${surveyId}/logs`
    );
    return response.data;
  },
};