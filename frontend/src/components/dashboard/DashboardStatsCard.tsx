export interface DashboardStats {
  totalSurveys: number;
  completedSurveys: number;
  completionRate: number;
}

export interface DashboardStatsCardProps {
  stats: DashboardStats;
  loading?: boolean;
}

export function DashboardStatsCard({ stats, loading = false }: DashboardStatsCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" data-testid="skeleton"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-2" data-testid="skeleton"></div>
          <div className="h-4 bg-gray-200 rounded w-full" data-testid="skeleton"></div>
        </div>
      </div>
    );
  }

  const { totalSurveys, completedSurveys, completionRate } = stats;
  const isAllCompleted = totalSurveys > 0 && completionRate === 100;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">回答状況</h2>

      {isAllCompleted && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4" role="alert">
          <div className="flex items-center">
            <span className="text-2xl mr-2">🎉</span>
            <div>
              <p className="font-bold text-green-800">すべての調査が完了しました!</p>
              <p className="text-sm text-green-700 mt-1">ご協力ありがとうございます。</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <p className="text-3xl font-bold text-blue-600">{totalSurveys}</p>
          <p className="text-sm text-gray-600 mt-1">全体調査数</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-green-600">{completedSurveys}</p>
          <p className="text-sm text-gray-600 mt-1">回答済み</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">完了率</span>
          <span className="text-sm font-bold text-gray-900">{completionRate}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${completionRate}%` }}
            aria-valuenow={completionRate}
            aria-valuemin={0}
            aria-valuemax={100}
            role="progressbar"
          ></div>
        </div>
      </div>
    </div>
  );
}
