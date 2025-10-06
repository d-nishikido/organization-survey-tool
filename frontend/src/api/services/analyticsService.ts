import apiClient from '../client';
import { ApiResponse } from '../types';
import { ReportRequest } from '../../types/reports';

interface DashboardData {
  totalSurveys: number;
  completedSurveys: number;
  averageCompletionRate: number;
  responseRate: number;
  recentSurveys: Array<{
    id: string;
    title: string;
    status: string;
    completionRate: number;
    responseCount: number;
  }>;
  trends: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
    }>;
  };
}

interface SurveyAnalytics {
  surveyId: string;
  title: string;
  totalResponses: number;
  completionRate: number;
  averageTimeToComplete: number;
  questionAnalytics: Array<{
    questionId: string;
    question: string;
    responseDistribution: Record<string, number>;
    averageScore?: number;
  }>;
  demographics: Record<string, any>;
}


interface SurveySummary {
  survey_id: number;
  survey_title: string;
  total_responses: number;
  completion_rate: number;
  average_scores: Record<string, number>;
  response_distribution: Record<string, number>;
  generated_at: string;
}

interface CategoryAnalysis {
  category_code: string;
  category_name: string;
  response_count: number;
  average_score: number;
  statistics: {
    mean: number;
    median: number;
    standardDeviation: number;
    variance: number;
    min: number;
    max: number;
    count: number;
    quartiles: {
      q1: number;
      q2: number;
      q3: number;
    };
  };
  distribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
}

interface TrendData {
  period: string;
  data_points: Array<{
    date: string;
    value: number;
    count: number;
  }>;
  trend: 'increasing' | 'decreasing' | 'stable';
  change_percentage: number;
}

export class AnalyticsService {
  private static readonly BASE_PATH = '/api/analytics';

/**
   * Get survey summary with analytics cache
   */
  static async getSurveySummary(
    surveyId: number
  ): Promise<ApiResponse<SurveySummary>> {
    return apiClient.get<ApiResponse<SurveySummary>>(`${this.BASE_PATH}/summary`, {
      params: { survey_id: surveyId },
    });
  }

  /**
   * Get category analysis
   */
  static async getCategoryAnalysis(
    surveyId: number,
    categoryCode?: string
  ): Promise<ApiResponse<{ categories: CategoryAnalysis[] }>> {
    return apiClient.get<ApiResponse<{ categories: CategoryAnalysis[] }>>(
      `${this.BASE_PATH}/categories`,
      {
        params: {
          survey_id: surveyId,
          category: categoryCode,
        },
      }
    );
  }

  /**
   * Get trend analysis
   */
  static async getTrendAnalysis(
    params: {
      surveyId?: number;
      category?: string;
      period?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    }
  ): Promise<ApiResponse<TrendData>> {
    return apiClient.get<ApiResponse<TrendData>>(`${this.BASE_PATH}/trends`, {
      params: {
        survey_id: params.surveyId,
        category: params.category,
        period: params.period || 'monthly',
      },
    });
  }

  /**
   * Get dashboard data
   */
  static async getDashboard(params?: {
    period?: 'week' | 'month' | 'quarter' | 'year';
    departmentId?: string;
  }): Promise<ApiResponse<DashboardData>> {
    return apiClient.get<ApiResponse<DashboardData>>(`${this.BASE_PATH}/dashboard`, {
      params,
    });
  }

  /**
   * Get analytics for a specific survey
   */
  static async getSurveyAnalytics(
    surveyId: string,
    params?: {
      includeDetails?: boolean;
      groupBy?: 'department' | 'location' | 'role';
    }
  ): Promise<ApiResponse<SurveyAnalytics>> {
    return apiClient.get<ApiResponse<SurveyAnalytics>>(
      `${this.BASE_PATH}/surveys/${surveyId}`,
      { params }
    );
  }

  /**
   * Get comparative analytics across surveys
   */
  static async getComparativeAnalytics(
    surveyIds: string[]
  ): Promise<ApiResponse<{
    surveys: SurveyAnalytics[];
    comparison: Record<string, any>;
  }>> {
    return apiClient.post<ApiResponse<{
      surveys: SurveyAnalytics[];
      comparison: Record<string, any>;
    }>>(`${this.BASE_PATH}/compare`, { surveyIds });
  }

  /**
   * Generate report
   */
  static async generateReport(
    request: ReportRequest
  ): Promise<ApiResponse<{ reportId: string; downloadUrl?: string }>> {
    return apiClient.post<ApiResponse<{ reportId: string; downloadUrl?: string }>>(
      `${this.BASE_PATH}/reports/generate`,
      request
    );
  }

  /**
   * Get report status
   */
  static async getReportStatus(
    reportId: string
  ): Promise<ApiResponse<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    downloadUrl?: string;
    error?: string;
  }>> {
    return apiClient.get<ApiResponse<{
      status: 'pending' | 'processing' | 'completed' | 'failed';
      downloadUrl?: string;
      error?: string;
    }>>(`${this.BASE_PATH}/reports/${reportId}/status`);
  }

  /**
   * Download report
   */
  static async downloadReport(reportId: string): Promise<Blob> {
    const response = await apiClient.getInstance().get(
      `${this.BASE_PATH}/reports/${reportId}/download`,
      {
        responseType: 'blob',
      }
    );
    return response.data;
  }

  /**
   * Get real-time statistics
   */
  static async getRealTimeStats(): Promise<ApiResponse<{
    activeSurveys: number;
    onlineUsers: number;
    todayResponses: number;
    averageResponseTime: number;
  }>> {
    return apiClient.get<ApiResponse<{
      activeSurveys: number;
      onlineUsers: number;
      todayResponses: number;
      averageResponseTime: number;
    }>>(`${this.BASE_PATH}/realtime`);
  }

  /**
   * Get response trends
   */
  static async getResponseTrends(params?: {
    period?: 'day' | 'week' | 'month';
    surveyId?: string;
  }): Promise<ApiResponse<{
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
    }>;
  }>> {
    return apiClient.get<ApiResponse<{
      labels: string[];
      datasets: Array<{
        label: string;
        data: number[];
      }>;
    }>>(`${this.BASE_PATH}/trends`, { params });
  }



  /**
   * Export analytics data (legacy method - calls new report API)
   */
  static async exportData(
    surveyId: string,
    format: 'csv' | 'excel' | 'json'
  ): Promise<Blob> {
    const response = await apiClient.getInstance().get(
      `${this.BASE_PATH}/export/${surveyId}`,
      {
        params: { format },
        responseType: 'blob',
      }
    );
    return response.data;
  }
}

export default AnalyticsService;