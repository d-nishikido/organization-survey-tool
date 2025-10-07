import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmployeeLayout } from '@/components/common/EmployeeLayout';
import { DashboardStatsCard } from '@/components/dashboard/DashboardStatsCard';
import { SurveyCardList } from '@/components/dashboard/SurveyCardList';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { SurveyWithStatus } from '@/components/dashboard';

type FilterType = 'all' | 'pending' | 'completed';

export function EmployeeDashboardPage(): JSX.Element {
  const navigate = useNavigate();
  const { surveys, stats, isLoading, error, refetch } = useDashboardData();
  const [filter, setFilter] = useState<FilterType>('all');

  // Filter surveys based on selected filter
  const filteredSurveys = surveys.filter(survey => {
    if (filter === 'pending') return !survey.isCompleted;
    if (filter === 'completed') return survey.isCompleted;
    return true; // 'all'
  });

  // Handle survey card click
  const handleSurveyClick = (surveyId: string | number, isCompleted: boolean) => {
    if (isCompleted) {
      // Show completion message (could be a toast notification)
      alert('この調査は既に回答済みです。');
      return;
    }
    navigate(`/survey/${surveyId}`);
  };

  return (
    <EmployeeLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ダッシュボード
          </h1>
          <p className="text-gray-600">
            回答状況と公開中の調査を確認できます
          </p>
        </div>

        {/* Statistics Card */}
        <div className="mb-8">
          <DashboardStatsCard stats={stats} loading={isLoading} />
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="調査フィルタ">
              <button
                onClick={() => setFilter('all')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${filter === 'all'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
                aria-current={filter === 'all' ? 'page' : undefined}
              >
                全て ({surveys.length})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${filter === 'pending'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
                aria-current={filter === 'pending' ? 'page' : undefined}
              >
                未回答のみ ({surveys.filter(s => !s.isCompleted).length})
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${filter === 'completed'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
                aria-current={filter === 'completed' ? 'page' : undefined}
              >
                回答済みのみ ({surveys.filter(s => s.isCompleted).length})
              </button>
            </nav>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">
              調査データの取得に失敗しました。
            </p>
            <button
              onClick={() => refetch()}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              再試行
            </button>
          </div>
        )}

        {/* Survey List */}
        {!error && (
          <SurveyCardList
            surveys={filteredSurveys}
            onSurveyClick={handleSurveyClick}
            loading={isLoading}
            emptyMessage={
              filter === 'pending'
                ? '未回答の調査はありません。'
                : filter === 'completed'
                ? '回答済みの調査はありません。'
                : '現在、回答可能な調査はありません。'
            }
          />
        )}
      </div>
    </EmployeeLayout>
  );
}
