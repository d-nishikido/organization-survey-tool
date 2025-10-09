import { apiClient } from '../client';
import type { CategoryWithQuestionCount } from '@/types/category';
import type { CreateCategoryInput, UpdateCategoryInput } from '@/schemas/category.schema';

export interface CategoryQueryParams {
  active?: boolean;
}

export const categoryService = {
  /**
   * Get all categories with optional filtering
   */
  async getCategories(params: CategoryQueryParams = {}): Promise<CategoryWithQuestionCount[]> {
    const searchParams = new URLSearchParams();

    if (params.active !== undefined) {
      searchParams.append('active', params.active.toString());
    }

    const queryString = searchParams.toString();
    const url = queryString ? `/api/categories?${queryString}` : '/api/categories';
    
    const response = await apiClient.get(url) as CategoryWithQuestionCount[];
    return response;
  },

  /**
   * Get a single category by ID
   */
  async getCategory(id: number): Promise<CategoryWithQuestionCount> {
    const response = await apiClient.get(`/api/categories/${id}`) as CategoryWithQuestionCount;
    return response;
  },

  /**
   * Create a new category
   */
  async createCategory(data: CreateCategoryInput): Promise<CategoryWithQuestionCount> {
    const response = await apiClient.post('/api/categories', data) as CategoryWithQuestionCount;
    return response;
  },

  /**
   * Update an existing category
   */
  async updateCategory(
    id: number,
    data: UpdateCategoryInput
  ): Promise<CategoryWithQuestionCount> {
    const response = await apiClient.put(`/api/categories/${id}`, data) as CategoryWithQuestionCount;
    return response;
  },

  /**
   * Delete a category
   */
  async deleteCategory(id: number): Promise<void> {
    await apiClient.delete(`/api/categories/${id}`);
  },

  /**
   * Toggle category active status
   */
  async toggleCategoryStatus(id: number): Promise<CategoryWithQuestionCount> {
    const response = await apiClient.patch(`/api/categories/${id}/status`, {}) as CategoryWithQuestionCount;
    return response;
  },

  /**
   * Reorder categories
   */
  async reorderCategories(orderedIds: number[]): Promise<void> {
    await apiClient.patch('/api/categories/reorder', { orderedIds });
  },
};
