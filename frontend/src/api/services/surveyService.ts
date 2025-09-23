import apiClient from '../client';
import { ApiResponse, PaginatedResponse } from '../types';
import { Survey, Question, SurveyResponse } from '@/types/survey';

export class SurveyService {
  private static readonly BASE_PATH = '/api/surveys';

  /**
   * Get list of available surveys
   */
  static async getSurveys(params?: {
    page?: number;
    pageSize?: number;
    status?: 'draft' | 'active' | 'closed' | 'archived';
  }): Promise<PaginatedResponse<Survey>> {
    return apiClient.get<PaginatedResponse<Survey>>(this.BASE_PATH, { params });
  }

  /**
   * Get survey details by ID
   */
  static async getSurveyById(surveyId: string): Promise<ApiResponse<Survey>> {
    return apiClient.get<ApiResponse<Survey>>(`${this.BASE_PATH}/${surveyId}`);
  }

  /**
   * Get survey questions
   */
  static async getSurveyQuestions(surveyId: string): Promise<ApiResponse<Question[]>> {
    return apiClient.get<ApiResponse<Question[]>>(`${this.BASE_PATH}/${surveyId}/questions`);
  }

  /**
   * Submit survey response
   */
  static async submitResponse(
    surveyId: string,
    responses: Record<string, any>
  ): Promise<ApiResponse<{ responseId: string }>> {
    return apiClient.post<ApiResponse<{ responseId: string }>>(
      `${this.BASE_PATH}/${surveyId}/responses`,
      { responses }
    );
  }

  /**
   * Save partial survey progress
   */
  static async saveProgress(
    surveyId: string,
    progress: Partial<SurveyResponse>
  ): Promise<ApiResponse<void>> {
    return apiClient.put<ApiResponse<void>>(
      `${this.BASE_PATH}/${surveyId}/progress`,
      progress
    );
  }

  /**
   * Get saved survey progress
   */
  static async getProgress(surveyId: string): Promise<ApiResponse<SurveyResponse | null>> {
    return apiClient.get<ApiResponse<SurveyResponse | null>>(
      `${this.BASE_PATH}/${surveyId}/progress`
    );
  }

  /**
   * Delete survey progress
   */
  static async clearProgress(surveyId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(`${this.BASE_PATH}/${surveyId}/progress`);
  }

  /**
   * Validate survey responses before submission
   */
  static async validateResponses(
    surveyId: string,
    responses: Record<string, any>
  ): Promise<ApiResponse<{ valid: boolean; errors?: Record<string, string> }>> {
    return apiClient.post<ApiResponse<{ valid: boolean; errors?: Record<string, string> }>>(
      `${this.BASE_PATH}/${surveyId}/validate`,
      { responses }
    );
  }
}

export default SurveyService;