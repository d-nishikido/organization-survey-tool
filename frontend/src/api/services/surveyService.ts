import apiClient from '../client';
import { ApiResponse, PaginatedResponse } from '../types';
import { Survey, Question, SurveyResponse, CreateSurveyDto } from '@/types/survey';

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
   * Create a new survey
   */
  static async createSurvey(surveyData: CreateSurveyDto): Promise<ApiResponse<Survey>> {
    return apiClient.post<ApiResponse<Survey>>(this.BASE_PATH, surveyData);
  }

  /**
   * Update an existing survey
   */
  static async updateSurvey(surveyId: string, surveyData: Partial<CreateSurveyDto>): Promise<ApiResponse<Survey>> {
    return apiClient.put<ApiResponse<Survey>>(`${this.BASE_PATH}/${surveyId}`, surveyData);
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
   * Delete a survey (draft status only)
   */
  static async deleteSurvey(surveyId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(`${this.BASE_PATH}/${surveyId}`);
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

// Export both the class and a singleton instance
export const surveyService = SurveyService;
export default SurveyService;