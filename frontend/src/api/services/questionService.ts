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

    const response = await apiClient.get(`/questions?${searchParams.toString()}`) as { data: QuestionList };
    return response.data;
  },

  /**
   * Get a single question by ID
   */
  async getQuestion(id: number): Promise<QuestionResponse> {
    const response = await apiClient.get(`/questions/${id}`) as { data: QuestionResponse };
    return response.data;
  },

  /**
   * Create a new question
   */
  async createQuestion(data: CreateQuestionDto): Promise<QuestionResponse> {
    const response = await apiClient.post('/questions', data) as { data: QuestionResponse };
    return response.data;
  },

  /**
   * Update an existing question
   */
  async updateQuestion(id: number, data: UpdateQuestionDto): Promise<QuestionResponse> {
    const response = await apiClient.put(`/questions/${id}`, data) as { data: QuestionResponse };
    return response.data;
  },

  /**
   * Delete a question
   */
  async deleteQuestion(id: number): Promise<void> {
    await apiClient.delete(`/questions/${id}`);
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