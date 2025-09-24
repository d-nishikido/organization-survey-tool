import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin';
import { Card, Loading } from '@/components/ui';

import { analyticsService } from '@/api/services';
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
  period: 'week' | 'month' | 'quarter' | 'year';
  category?: 'engagement' | 'satisfaction' | 'leadership' | 'culture' | 'growth' | 'worklife' | 'communication' | 'other';
  surveyId?: string;
  startDate?: string;
  endDate?: string;
}

const AnalyticsDashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<FilterState>({
    period: 'month',
    surveyId: searchParams.get('survey') || undefined,
  });

  const [dashboardData, setDashboardData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Simulate API call - replace with actual service calls
        const mockData: AnalyticsData = {
          summary: {
            totalSurveys: 12,
            completedSurveys: 8,
            averageCompletionRate: 78.3,
            responseRate: 85.2,
            totalResponses: 1247,
            averageTimeToComplete: 12,
          },
          trends: {
            labels: ['1月', '2月', '3月', '4月', '5月', '6月'],
            datasets: [
              {
                label: '回答数',
                data: [120, 150, 180, 220, 200, 250],
                color: '#3B82F6',
              },
              {
                label: '完了率',
                data: [65, 70, 75, 80, 78, 85],
                color: '#10B981',
              },
            ],
          },
          categoryAnalysis: [
            {
              category: 'engagement',
              averageScore: 4.2,
              responseCount: 856,
              distribution: { '1': 45, '2': 120, '3': 350, '4': 250, '5': 91 },
            },
            {
              category: 'satisfaction',
              averageScore: 3.8,
              responseCount: 742,
              distribution: { '1': 62, '2': 156, '3': 298, '4': 180, '5': 46 },
            },
            {
              category: 'leadership',
              averageScore: 3.5,
              responseCount: 689,
              distribution: { '1': 89, '2': 178, '3': 267, '4': 125, '5': 30 },
            },
          ],
          recentActivity: [
            {
              id: '1',
              type: 'survey_created',
              description: '新しい調査「2024年度エンゲージメント調査」が作成されました',
              timestamp: '2024-01-15T10:30:00Z',
            },
            {
              id: '2',
              type: 'response_received',
              description: '25件の新しい回答が収集されました',
              timestamp: '2024-01-15T08:15:00Z',
            },
            {
              id: '3',
              type: 'analysis_generated',
              description: '週次分析レポートが生成されました',
              timestamp: '2024-01-14T16:45:00Z',
            },
          ],
        };

        setLoading(true);
        setError(null);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setDashboardData(mockData);
        setLoading(false);
      } catch (err) {
        setLoading(false);
        setError('Failed to load dashboard data');
        console.error('Failed to load dashboard data:', err);
      }
    };

    loadDashboardData();
  }, [filters]);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      if (filters.surveyId) {
        // Convert pdf to json for compatibility with existing service
        const exportFormat = format === 'pdf' ? 'json' : format;
        await analyticsService.exportData(filters.surveyId, exportFormat);
        // Handle download
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

  if (error || !dashboardData) {
    return (
      <AdminLayout>
        <div className="text-center py-8">
          <p className="text-red-600">ダッシュボードデータの読み込みに失敗しました</p>
        </div>
      </AdminLayout>
    );
  }

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