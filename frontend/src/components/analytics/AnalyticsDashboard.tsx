import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { AdminLayout } from '@/components/admin';
import { Card, Loading } from '@/components/ui';

import { AnalyticsService } from '@/api/services/analyticsService';
import AnalyticsCards from './AnalyticsCards';
import ChartComponents from './ChartComponents';
import FilterPanel from './FilterPanel';
import ExportTools from './ExportTools';
import TrendAnalysis from './TrendAnalysis';

interface AnalyticsData {
  summary: {
    totalSurveys: number;
    completedSurveys: number;
    averageCompletionRate: number;
    responseRate: number;
    totalResponses: number;
    averageTimeToComplete: number;
  };
  trends: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      color?: string;
    }>;
  };
  categoryAnalysis: Array<{
    category: string;
    averageScore: number;
    responseCount: number;
    distribution: Record<string, number>;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'survey_created' | 'response_received' | 'analysis_generated';
    description: string;
    timestamp: string;
  }>;
}

interface FilterState {
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  category?: string;
  surveyId?: number;
  startDate?: string;
  endDate?: string;
}

const AnalyticsDashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<FilterState>({
    period: 'monthly',
    surveyId: searchParams.get('survey') ? parseInt(searchParams.get('survey')!) : undefined,
  });

  // Fetch survey summary
  const { data: summaryData, isLoading: summaryLoading, error: summaryError, refetch: refetchSummary } = useQuery(
    ['surveySummary', filters.surveyId],
    async () => {
      if (!filters.surveyId) return null;
      const response = await AnalyticsService.getSurveySummary(filters.surveyId);
      return response.data;
    },
    {
      enabled: !!filters.surveyId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    }
  );

  // Fetch category analysis
  const { data: categoryData, isLoading: categoryLoading } = useQuery(
    ['categoryAnalysis', filters.surveyId, filters.category],
    async () => {
      if (!filters.surveyId) return null;
      const response = await AnalyticsService.getCategoryAnalysis(
        filters.surveyId,
        filters.category
      );
      return response.data;
    },
    {
      enabled: !!filters.surveyId,
      staleTime: 5 * 60 * 1000,
    }
  );

  // Fetch trend analysis
  const { data: trendData, isLoading: trendLoading } = useQuery(
    ['trendAnalysis', filters.surveyId, filters.category, filters.period],
    async () => {
      const response = await AnalyticsService.getTrendAnalysis({
        surveyId: filters.surveyId,
        category: filters.category,
        period: filters.period,
      });
      return response.data;
    },
    {
      staleTime: 5 * 60 * 1000,
    }
  );

  const loading = summaryLoading || categoryLoading || trendLoading;
  const error = summaryError ? 'Failed to load dashboard data' : null;

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      if (filters.surveyId) {
        // Use the new report generation API
        const response = await AnalyticsService.generateReport({
          surveyId: filters.surveyId,
          format: format === 'pdf' ? 'pdf' : format,
          template: 'summary',
          options: {
            includeRawData: true,
            includeCharts: true,
          },
        });
        
        // Poll for completion and download
        const reportId = response.data.reportId;
        const pollInterval = setInterval(async () => {
          const statusResponse = await AnalyticsService.getReportStatus(reportId);
          if (statusResponse.data.status === 'completed') {
            clearInterval(pollInterval);
            const blob = await AnalyticsService.downloadReport(reportId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `analytics-report.${format === 'excel' ? 'xlsx' : format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          } else if (statusResponse.data.status === 'failed') {
            clearInterval(pollInterval);
            console.error('Report generation failed:', statusResponse.data.error);
          }
        }, 3000);
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loading size="xl" />
        </div>
      </AdminLayout>
    );
  }

  if (error || (!summaryData && filters.surveyId)) {
    return (
      <AdminLayout>
        <div className="text-center py-8">
          <p className="text-red-600">ダッシュボードデータの読み込みに失敗しました</p>
          <button 
            onClick={() => refetchSummary()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            再試行
          </button>
        </div>
      </AdminLayout>
    );
  }

  // Show message if no survey selected
  if (!filters.surveyId || !summaryData) {
    return (
      <AdminLayout>
        <div className="text-center py-8">
          <p className="text-gray-600">調査を選択してください</p>
        </div>
      </AdminLayout>
    );
  }

  // Transform data for display
  const dashboardData: AnalyticsData = {
    summary: {
      totalSurveys: 1,
      completedSurveys: summaryData.completion_rate >= 100 ? 1 : 0,
      averageCompletionRate: summaryData.completion_rate,
      responseRate: summaryData.completion_rate,
      totalResponses: summaryData.total_responses,
      averageTimeToComplete: 12, // Mock data - not available from API
    },
    trends: {
      labels: trendData?.data_points.map(p => p.date) || [],
      datasets: [{
        label: 'スコア',
        data: trendData?.data_points.map(p => p.value) || [],
        color: '#3B82F6',
      }],
    },
    categoryAnalysis: categoryData?.categories.map(cat => ({
      category: cat.category_code,
      averageScore: cat.average_score,
      responseCount: cat.response_count,
      distribution: cat.distribution.reduce((acc, dist) => {
        acc[dist.range] = dist.count;
        return acc;
      }, {} as Record<string, number>),
    })) || [],
    recentActivity: [], // Mock data - not available from API
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                分析ダッシュボード
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                調査結果の詳細分析と可視化
              </p>
            </div>
            <ExportTools onExport={handleExport} />
          </div>
        </div>

        {/* Filters */}
        <FilterPanel
          filters={filters}
          onChange={handleFilterChange}
        />

        {/* Summary Cards */}
        <AnalyticsCards summary={dashboardData.summary} />

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trend Chart */}
          <Card variant="default" padding="lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              回答トレンド
            </h3>
            <ChartComponents
              type="line"
              data={dashboardData.trends}
              height={300}
            />
          </Card>

          {/* Category Analysis */}
          <Card variant="default" padding="lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              カテゴリ別分析
            </h3>
            <ChartComponents
              type="bar"
              data={{
                labels: dashboardData.categoryAnalysis.map(item => item.category),
                datasets: [{
                  label: '平均スコア',
                  data: dashboardData.categoryAnalysis.map(item => item.averageScore),
                  color: '#8B5CF6',
                }]
              }}
              height={300}
            />
          </Card>
        </div>

        {/* Detailed Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trend Analysis */}
          <div className="lg:col-span-2">
            <TrendAnalysis
              data={dashboardData.trends}
              categoryData={dashboardData.categoryAnalysis}
            />
          </div>

          {/* Recent Activity */}
          <Card variant="default" padding="lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              最近のアクティビティ
            </h3>
            <div className="space-y-4">
              {dashboardData.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.type === 'survey_created' ? 'bg-blue-100' :
                      activity.type === 'response_received' ? 'bg-green-100' :
                      'bg-yellow-100'
                    }`}>
                      <span className="text-sm">
                        {activity.type === 'survey_created' ? '📝' :
                         activity.type === 'response_received' ? '✅' : '📊'}
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleString('ja-JP')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AnalyticsDashboard;