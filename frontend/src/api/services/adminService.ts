import apiClient from '../client';
import { ApiResponse } from '../types';

export interface AdminStats {
  active_surveys: number;
  total_responses: number;
  response_rate: number;
  avg_completion_time: number;
}

export interface RecentActivity {
  id: number;
  type: 'survey_created' | 'responses_received' | 'report_generated';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
}

export class AdminService {
  private static readonly BASE_PATH = '/api/admin';

  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(): Promise<ApiResponse<AdminStats>> {
    return apiClient.get<ApiResponse<AdminStats>>(`${this.BASE_PATH}/stats`);
  }

  /**
   * Get recent activity
   */
  static async getRecentActivity(limit = 10): Promise<ApiResponse<RecentActivity[]>> {
    return apiClient.get<ApiResponse<RecentActivity[]>>(`${this.BASE_PATH}/activity`, {
      params: { limit }
    });
  }

  /**
   * Get surveys for admin (with additional admin info)
   */
  static async getAdminSurveys(params?: {
    page?: number;
    pageSize?: number;
    status?: 'draft' | 'active' | 'closed' | 'archived';
    search?: string;
  }): Promise<ApiResponse<{
    surveys: any[];
    total: number;
    page: number;
    pageSize: number;
  }>> {
    return apiClient.get<ApiResponse<{
      surveys: any[];
      total: number;
      page: number;
      pageSize: number;
    }>>(`${this.BASE_PATH}/surveys`, { params });
  }
}

export default AdminService;