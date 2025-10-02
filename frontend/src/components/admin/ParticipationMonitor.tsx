import { useState, useEffect } from 'react';
import { Card, Loading, Alert } from '../ui';
import { ProgressBar } from '../common';
import { operationService } from '../../api/services/operationService';
import type { ParticipationStats } from '../../types/operation';

interface ParticipationMonitorProps {
  surveyId: number;
  refreshInterval?: number; // Refresh interval in milliseconds
}

export function ParticipationMonitor({
  surveyId,
  refreshInterval = 30000 // Default: 30 seconds
}: ParticipationMonitorProps) {
  const [stats, setStats] = useState<ParticipationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    // Initial fetch
    fetchStats();

    // Set up polling
    const interval = setInterval(fetchStats, refreshInterval);

    return () => clearInterval(interval);
  }, [surveyId, refreshInterval]);

  const fetchStats = async () => {
    try {
      const data = await operationService.getParticipationStats(surveyId);
      setStats(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError('参加状況の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Utility function for progress bar color (currently unused)
  // const getProgressBarColor = (rate: number): 'primary' | 'success' | 'warning' | 'danger' => {
  //   if (rate >= 80) return 'success';
  //   if (rate >= 60) return 'primary';
  //   if (rate >= 40) return 'warning';
  //   return 'danger';
  // };

  if (loading && !stats) {
    return (
      <Card variant="default" padding="md">
        <div className="flex justify-center items-center h-64">
          <Loading size="lg" />
        </div>
      </Card>
    );
  }

  if (error && !stats) {
    return (
      <Card variant="default" padding="md">
        <Alert variant="danger" title="エラー">
          {error}
        </Alert>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  // Calculate max responses for chart scaling
  const maxResponses = Math.max(
    ...stats.dailyProgress.map(d => d.cumulativeResponses),
    1
  );

  return (
    <Card variant="default" padding="md">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">参加状況モニター</h3>
          <div className="text-sm text-gray-500">
            最終更新: {lastUpdated.toLocaleTimeString('ja-JP')}
          </div>
        </div>

        {error && (
          <Alert variant="warning" title="更新エラー">
            {error}
          </Alert>
        )}

        {/* Overall Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm font-medium text-blue-700">総従業員数</div>
            <div className="mt-1 text-2xl font-bold text-blue-900">
              {stats.totalEmployees.toLocaleString()}
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm font-medium text-green-700">回答数</div>
            <div className="mt-1 text-2xl font-bold text-green-900">
              {stats.totalResponses.toLocaleString()}
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm font-medium text-purple-700">回答率</div>
            <div className="mt-1 text-2xl font-bold text-purple-900">
              {formatPercentage(stats.responseRate)}
            </div>
          </div>
        </div>

        {/* Overall Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">全体進捗</span>
            <span className="text-sm text-gray-600">
              {stats.totalResponses} / {stats.totalEmployees}
            </span>
          </div>
          <ProgressBar
            current={stats.responseRate}
            total={100}
            showPercentage
          />
        </div>

        {/* Department Statistics */}
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">部門別参加状況</h4>
          <div className="space-y-3">
            {stats.byDepartment.map((dept) => (
              <div key={dept.department} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">
                    {dept.department}
                  </span>
                  <span className="text-gray-600">
                    {dept.responses} / {dept.totalEmployees}
                    ({formatPercentage(dept.responseRate)})
                  </span>
                </div>
                <ProgressBar
                  current={dept.responseRate}
                  total={100}
                  showPercentage={false}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Daily Progress Chart */}
        {stats.dailyProgress.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-3">日別進捗</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2">
                {stats.dailyProgress.map((day) => (
                  <div key={day.date} className="flex items-end space-x-2">
                    <div className="text-xs text-gray-600 w-16">
                      {formatDate(day.date)}
                    </div>
                    <div className="flex-1">
                      <div
                        className="bg-blue-500 rounded"
                        style={{
                          height: '24px',
                          width: `${(day.cumulativeResponses / maxResponses) * 100}%`,
                          minWidth: '2px'
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-700 w-12 text-right">
                      {day.responses}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                <span>累計: {stats.totalResponses}</span>
                <span>日平均: {Math.round(stats.totalResponses / Math.max(stats.dailyProgress.length, 1))}</span>
              </div>
            </div>
          </div>
        )}

        {/* Refresh Info */}
        <div className="border-t pt-4">
          <p className="text-sm text-gray-600">
            ※ データは{refreshInterval / 1000}秒ごとに自動更新されます
          </p>
        </div>
      </div>
    </Card>
  );
}