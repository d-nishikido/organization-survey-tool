import { apiClient } from '../client';

export interface SurveyQuestion {
  id: number;
  text: string;
  type: string;
  category_id: number;
  category: string;
  is_required: boolean;
  options?: string[] | null;
  order_num?: number;
}

export interface SurveyQuestionsData {
  surveyId: string;
  surveyTitle: string;
  availableQuestions: SurveyQuestion[];
  assignedQuestions: SurveyQuestion[];
}

export class SurveyQuestionService {
  /**
   * Get all questions for a survey (both available and assigned)
   */
  static async getSurveyQuestions(surveyId: string): Promise<SurveyQuestionsData> {
    try {
      // Get all available questions
      const allQuestionsResponse = await apiClient.get('/api/questions?pageSize=100');
      const allQuestions = allQuestionsResponse.data || [];

      // Get assigned questions for this survey
      const assignedResponse = await apiClient.get(`/api/surveys/${surveyId}/questions`);
      const assignedQuestions = assignedResponse.data || [];

      // Get survey info
      const surveyResponse = await apiClient.get(`/api/surveys/${surveyId}`);
      const survey = surveyResponse.data;

      // Filter out assigned questions from available questions
      const assignedIds = new Set(assignedQuestions.map((q: any) => q.id));
      const availableQuestions = allQuestions.filter((q: any) => !assignedIds.has(q.id));

      return {
        surveyId,
        surveyTitle: survey?.title || `調査 ${surveyId}`,
        availableQuestions: availableQuestions.map((q: any) => this.mapQuestionFromApi(q)),
        assignedQuestions: assignedQuestions.map((q: any, index: number) => ({
          ...this.mapQuestionFromApi(q),
          order_num: q.display_order || index + 1,
        })),
      };
    } catch (error) {
      console.error('Error fetching survey questions:', error);
      throw error;
    }
  }

  /**
   * Assign questions to a survey
   */
  static async assignQuestions(surveyId: string, questionIds: number[]): Promise<void> {
    try {
      // Remove all existing assignments first
      const currentAssigned = await apiClient.get(`/api/surveys/${surveyId}/questions`);
      const currentQuestions = currentAssigned.data || [];

      for (const question of currentQuestions) {
        await apiClient.delete(`/api/surveys/${surveyId}/questions/${question.id}`);
      }

      // Assign new questions with proper order
      for (let i = 0; i < questionIds.length; i++) {
        await apiClient.post(`/api/surveys/${surveyId}/questions`, {
          question_id: questionIds[i],
          question_order: i + 1,
        });
      }
    } catch (error) {
      console.error('Error assigning questions:', error);
      throw error;
    }
  }

  /**
   * Update question order in a survey
   */
  static async updateQuestionOrder(surveyId: string, questionIds: number[]): Promise<void> {
    try {
      const questions = questionIds.map((questionId, index) => ({
        question_id: questionId,
        question_order: index + 1,
      }));

      await apiClient.put(`/api/surveys/${surveyId}/questions/order`, {
        questions,
      });
    } catch (error) {
      console.error('Error updating question order:', error);
      throw error;
    }
  }

  /**
   * Remove a question from a survey
   */
  static async removeQuestionFromSurvey(surveyId: string, questionId: number): Promise<void> {
    try {
      await apiClient.delete(`/api/surveys/${surveyId}/questions/${questionId}`);
    } catch (error) {
      console.error('Error removing question from survey:', error);
      throw error;
    }
  }

  /**
   * Map API response to frontend question format
   */
  private static mapQuestionFromApi(apiQuestion: any): SurveyQuestion {
    return {
      id: apiQuestion.id,
      text: apiQuestion.question || apiQuestion.question_text || apiQuestion.text,
      type: apiQuestion.type || apiQuestion.question_type,
      category_id: this.mapCategoryToId(apiQuestion.category),
      category: apiQuestion.category,
      is_required: apiQuestion.is_required,
      options: apiQuestion.options,
    };
  }

  /**
   * Map category code to ID (temporary mapping until backend provides IDs)
   */
  private static mapCategoryToId(category: string): number {
    const categoryMap: Record<string, number> = {
      'A': 1,
      'B': 2,
      'C': 3,
      'D': 4,
      'E': 5,
      'F': 6,
      'G': 7,
    };
    return categoryMap[category] || 1;
  }
}