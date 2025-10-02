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
      `/api/surveys/${surveyId}/start`
    );
    return response;
  },

  /**
   * Stop a survey
   */
  async stopSurvey(surveyId: number): Promise<SurveyOperation> {
    const response = await apiClient.post<SurveyOperation>(
      `/api/surveys/${surveyId}/stop`
    );
    return response;
  },

  /**
   * Pause a survey
   */
  async pauseSurvey(surveyId: number): Promise<SurveyOperation> {
    const response = await apiClient.post<SurveyOperation>(
      `/api/surveys/${surveyId}/pause`
    );
    return response;
  },

  /**
   * Resume a paused survey
   */
  async resumeSurvey(surveyId: number): Promise<SurveyOperation> {
    const response = await apiClient.post<SurveyOperation>(
      `/api/surveys/${surveyId}/resume`
    );
    return response;
  },

  /**
   * Create a reminder for a survey
   */
  async createReminder(reminder: ReminderSettings): Promise<ReminderSettings> {
    const response = await apiClient.post<ReminderSettings>(
      `/api/surveys/${reminder.surveyId}/reminders`,
      reminder
    );
    return response;
  },

  /**
   * Get all reminders for a survey
   */
  async getSurveyReminders(surveyId: number): Promise<ReminderSettings[]> {
    const response = await apiClient.get<ReminderSettings[]>(
      `/api/surveys/${surveyId}/reminders`
    );
    return response;
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
      `/api/surveys/${surveyId}/reminders/${reminderId}`,
      data
    );
    return response;
  },

  /**
   * Delete a reminder
   */
  async deleteReminder(surveyId: number, reminderId: number): Promise<void> {
    await apiClient.delete(`/api/surveys/${surveyId}/reminders/${reminderId}`);
  },

  /**
   * Get participation statistics for a survey
   */
  async getParticipationStats(surveyId: number): Promise<ParticipationStats> {
    const response = await apiClient.get<ParticipationStats>(
      `/api/surveys/${surveyId}/participation`
    );
    return response;
  },

  /**
   * Get operation logs for a survey
   */
  async getSurveyOperationLogs(surveyId: number): Promise<OperationLog[]> {
    const response = await apiClient.get<OperationLog[]>(
      `/api/surveys/${surveyId}/logs`
    );
    return response;
  },
};