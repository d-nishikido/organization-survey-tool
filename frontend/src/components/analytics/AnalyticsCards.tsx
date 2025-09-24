import React from 'react';
import { Card } from '@/components/ui';

interface SummaryData {
  totalSurveys: number;
  completedSurveys: number;
  averageCompletionRate: number;
  responseRate: number;
  totalResponses: number;
  averageTimeToComplete: number;
}

interface AnalyticsCardsProps {
  summary: SummaryData;
}

interface StatCardProps {
  icon: string;
  title: string;
  value: string | number;
  change?: {
    value: number;
    trend: 'up' | 'down' | 'stable';
    period: string;
  };
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'indigo';
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, change, color }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
    indigo: 'bg-indigo-500',
  };

  const changeColorClasses = {
    up: 'text-green-600 bg-green-100',
    down: 'text-red-600 bg-red-100',
    stable: 'text-gray-600 bg-gray-100',
  };

  return (
    <Card variant="default" padding="md">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`w-8 h-8 ${colorClasses[color]} rounded-md flex items-center justify-center`}>
            <span className="text-white text-lg">{icon}</span>
          </div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">
                {typeof value === 'number' && title.includes('率') 
                  ? `${value.toFixed(1)}%`
                  : typeof value === 'number' 
                    ? value.toLocaleString()
                    : value
                }
              </div>
              {change && (
                <div className={`ml-2 flex items-baseline text-sm font-semibold ${changeColorClasses[change.trend]}`}>
                  <span className="sr-only">
                    {change.trend === 'up' ? 'Increased' : change.trend === 'down' ? 'Decreased' : 'Unchanged'}
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs">
                    {change.trend === 'up' && '↗'}
                    {change.trend === 'down' && '↘'}
                    {change.trend === 'stable' && '→'}
                    {change.value > 0 ? '+' : ''}{change.value.toFixed(1)}%
                    <span className="ml-1 text-gray-500">({change.period})</span>
                  </span>
                </div>
              )}
            </dd>
          </dl>
        </div>
      </div>
    </Card>
  );
};

const AnalyticsCards: React.FC<AnalyticsCardsProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard
        icon="📊"
        title="総調査数"
        value={summary.totalSurveys}
        change={{
          value: 8.2,
          trend: 'up',
          period: '前月比'
        }}
        color="blue"
      />
      
      <StatCard
        icon="✅"
        title="完了調査数"
        value={summary.completedSurveys}
        change={{
          value: 12.5,
          trend: 'up',
          period: '前月比'
        }}
        color="green"
      />
      
      <StatCard
        icon="👥"
        title="総回答数"
        value={summary.totalResponses}
        change={{
          value: 5.4,
          trend: 'up',
          period: '前週比'
        }}
        color="purple"
      />
      
      <StatCard
        icon="📈"
        title="平均完了率"
        value={summary.averageCompletionRate}
        change={{
          value: -2.1,
          trend: 'down',
          period: '前月比'
        }}
        color="yellow"
      />
      
      <StatCard
        icon="🎯"
        title="回答率"
        value={summary.responseRate}
        change={{
          value: 3.8,
          trend: 'up',
          period: '前月比'
        }}
        color="indigo"
      />
      
      <StatCard
        icon="⏱️"
        title="平均回答時間"
        value={`${summary.averageTimeToComplete}分`}
        change={{
          value: -5.2,
          trend: 'down',
          period: '前月比'
        }}
        color="red"
      />
    </div>
  );
};

export default AnalyticsCards;