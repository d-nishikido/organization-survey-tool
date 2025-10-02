import { apiClient } from '../client';
import type {
  QuestionResponse,
  QuestionList,
  CreateQuestionDto,
  UpdateQuestionDto,
  QuestionQuery
} from '@/types/question';

export const questionService = {
  /**
   * Get all questions with filtering and pagination
   */
  async getQuestions(query: QuestionQuery = {}): Promise<QuestionList> {
    const searchParams = new URLSearchParams();

    if (query.page) searchParams.append('page', query.page.toString());
    if (query.pageSize) searchParams.append('pageSize', query.pageSize.toString());
    if (query.category) searchParams.append('category', query.category);
    if (query.type) searchParams.append('type', query.type);
    if (query.search) searchParams.append('search', query.search);

    const response = await apiClient.get(`/api/questions?${searchParams.toString()}`) as QuestionList;
    return response;
  },

  /**
   * Get a single question by ID
   */
  async getQuestion(id: number): Promise<QuestionResponse> {
    const response = await apiClient.get(`/api/questions/${id}`) as QuestionResponse;
    return response;
  },

  /**
   * Create a new question
   */
  async createQuestion(data: CreateQuestionDto): Promise<QuestionResponse> {
    try {
      const response = await apiClient.post('/api/questions', data) as QuestionResponse;
      return response;
    } catch (error: any) {
      // If we get a 404, it might be a timing issue - retry once
      if (error?.statusCode === 404) {
        console.warn('Question creation failed with 404, retrying in 500ms...');
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
          const response = await apiClient.post('/api/questions', data) as QuestionResponse;
          console.log('Question creation succeeded on retry');
          return response;
        } catch (retryError) {
          console.error('Question creation failed on retry:', retryError);
          throw retryError;
        }
      }
      throw error;
    }
  },

  /**
   * Update an existing question
   */
  async updateQuestion(id: number, data: UpdateQuestionDto): Promise<QuestionResponse> {
    const response = await apiClient.put(`/api/questions/${id}`, data) as QuestionResponse;
    return response;
  },

  /**
   * Delete a question
   */
  async deleteQuestion(id: number): Promise<void> {
    await apiClient.delete(`/api/questions/${id}`);
  },

  /**
   * Get questions by category
   */
  async getQuestionsByCategory(category: string): Promise<QuestionResponse[]> {
    const result = await this.getQuestions({ category: category as any, pageSize: 100 });
    return result.data;
  },

  /**
   * Get questions by type
   */
  async getQuestionsByType(type: string): Promise<QuestionResponse[]> {
    const result = await this.getQuestions({ type: type as any, pageSize: 100 });
    return result.data;
  },

  /**
   * Search questions by text
   */
  async searchQuestions(searchTerm: string): Promise<QuestionResponse[]> {
    const result = await this.getQuestions({ search: searchTerm, pageSize: 50 });
    return result.data;
  }
};