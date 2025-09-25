import { useState, useEffect } from 'react';
import { AdminLayout, AdminSection, PermissionBadge } from '@/components/admin';
import { useAuth } from '@/contexts/AuthContext';
import Card from '@/components/ui/Card';
import { Loading, Alert } from '@/components/ui';
import AdminService, { AdminStats, RecentActivity } from '@/api/services/adminService';

export function AdminDashboard(): JSX.Element {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // For now, use mock data but with proper API structure
        // TODO: Replace with actual API calls when backend is ready
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
        
        const mockStats: AdminStats = {
          active_surveys: 3,
          total_responses: 1247,
          response_rate: 78.3,
          avg_completion_time: 12
        };
        
        const mockActivity: RecentActivity[] = [
          {
            id: 1,
            type: 'survey_created',
            title: '新しい調査「2024年度エンゲージメント調査」が作成されました',
            description: '2時間前',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            icon: '📝'
          },
          {
            id: 2,
            type: 'responses_received',
            title: '25件の新しい回答が収集されました',
            description: '4時間前',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            icon: '✅'
          },
          {
            id: 3,
            type: 'report_generated',
            title: '週次分析レポートが生成されました',
            description: '1日前',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            icon: '📊'
          }
        ];
        
        setStats(mockStats);
        setRecentActivity(mockActivity);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('ダッシュボードデータの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loading size="lg" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                管理ダッシュボード
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                組織調査ツールの管理画面へようこそ
              </p>
            </div>
            {user?.role && (
              <PermissionBadge role={user.role} />
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="danger" title="エラー">
            {error}
          </Alert>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card variant="default" padding="md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-lg">📊</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    アクティブ調査
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.active_surveys || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </Card>

          <Card variant="default" padding="md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-lg">👥</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    総回答数
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.total_responses?.toLocaleString() || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </Card>

          <Card variant="default" padding="md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-lg">📈</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    回答率
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.response_rate ? `${stats.response_rate}%` : '0%'}
                  </dd>
                </dl>
              </div>
            </div>
          </Card>

          <Card variant="default" padding="md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-lg">⏱️</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    平均回答時間
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.avg_completion_time ? `${stats.avg_completion_time}分` : '0分'}
                  </dd>
                </dl>
              </div>
            </div>
          </Card>
        </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    アクティブ調査
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    3
                  </dd>
                </dl>
              </div>
            </div>
          </Card>

          <Card variant="default" padding="md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-lg">👥</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    総回答数
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    1,247
                  </dd>
                </dl>
              </div>
            </div>
          </Card>

          <Card variant="default" padding="md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-lg">📈</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    回答率
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    78.3%
                  </dd>
                </dl>
              </div>
            </div>
          </Card>

          <Card variant="default" padding="md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-lg">⏱️</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    平均回答時間
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    12分
                  </dd>
                </dl>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <AdminSection
          title="クイックアクション"
          description="よく使用される管理機能"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button className="relative p-6 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-left">
              <div className="flex items-center">
                <span className="text-2xl mr-3">📝</span>
                <div>
                  <h3 className="text-sm font-medium text-blue-900">
                    新しい調査を作成
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    新規調査の設定と作成
                  </p>
                </div>
              </div>
            </button>

            <button className="relative p-6 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-left">
              <div className="flex items-center">
                <span className="text-2xl mr-3">📊</span>
                <div>
                  <h3 className="text-sm font-medium text-green-900">
                    結果を分析
                  </h3>
                  <p className="text-sm text-green-700 mt-1">
                    回答結果の詳細分析
                  </p>
                </div>
              </div>
            </button>

            <button className="relative p-6 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-left">
              <div className="flex items-center">
                <span className="text-2xl mr-3">⚙️</span>
                <div>
                  <h3 className="text-sm font-medium text-purple-900">
                    システム設定
                  </h3>
                  <p className="text-sm text-purple-700 mt-1">
                    各種設定の管理
                  </p>
                </div>
              </div>
            </button>
          </div>
        </AdminSection>

        {/* Recent Activity */}
        <AdminSection
          title="最近のアクティビティ"
          description="システムの最新動向"
        >
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm">{activity.icon}</span>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-900">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-500">{activity.description}</p>
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                最近のアクティビティはありません
              </p>
            )}
          </div>
        </AdminSection>
      </div>
    </AdminLayout>
  );
}