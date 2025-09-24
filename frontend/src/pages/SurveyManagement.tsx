import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../components/admin';
import { Card, Button, Input, Loading, Alert } from '../components/ui';
import type { SurveyResponse } from '../types/survey';

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800',
  active: 'bg-green-100 text-green-800',
  closed: 'bg-blue-100 text-blue-800',
  archived: 'bg-yellow-100 text-yellow-800',
} as const;

const STATUS_LABELS = {
  draft: '下書き',
  active: 'アクティブ',
  closed: '終了',
  archived: 'アーカイブ',
} as const;

export function SurveyManagement(): JSX.Element {
  const [surveys, setSurveys] = useState<SurveyResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSurveys = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Mock implementation - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock data
      const mockSurveys: SurveyResponse[] = [
        {
          id: 1,
          title: "2024年度エンゲージメント調査",
          description: "従業員のエンゲージメント向上を目的とした調査です",
          status: "active",
          start_date: "2024-01-01T00:00:00Z",
          end_date: "2024-12-31T23:59:59Z",
          is_anonymous: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
          response_count: 245
        }
      ];
      
      setSurveys(mockSurveys);
      setTotalCount(mockSurveys.length);
    } catch (err) {
      setError('調査の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, [currentPage, searchTerm, statusFilter]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  const getResponseRate = (survey: SurveyResponse) => {
    // 仮の計算 - 実際の従業員数は別途取得が必要
    const estimatedEmployees = 1000;
    const responseCount = survey.response_count || 0;
    return ((responseCount / estimatedEmployees) * 100).toFixed(1);
  };

  if (loading && surveys.length === 0) {
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
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">調査管理</h1>
            <p className="mt-1 text-sm text-gray-600">
              組織調査の作成・管理を行います
            </p>
          </div>
          <Link to="/admin/surveys/new">
            <Button variant="primary" size="md">
              新しい調査を作成
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card variant="default" padding="md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                検索
              </label>
              <Input
                type="text"
                placeholder="調査名で検索..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ステータス
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
              >
                <option value="">すべて</option>
                <option value="draft">下書き</option>
                <option value="active">アクティブ</option>
                <option value="closed">終了</option>
                <option value="archived">アーカイブ</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  setCurrentPage(1);
                }}
              >
                フィルタをクリア
              </Button>
            </div>
          </div>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert variant="danger" title="エラー">
            調査の取得に失敗しました。再度お試しください。
          </Alert>
        )}

        {/* Surveys List */}
        <div className="space-y-4">
          {surveys.map((survey) => (
            <Card key={survey.id} variant="default" padding="md">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-medium text-gray-900">
                      {survey.title}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        STATUS_COLORS[survey.status]
                      }`}
                    >
                      {STATUS_LABELS[survey.status]}
                    </span>
                  </div>
                  
                  {survey.description && (
                    <p className="mt-1 text-sm text-gray-600">
                      {survey.description}
                    </p>
                  )}
                  
                  <div className="mt-2 flex items-center space-x-6 text-sm text-gray-500">
                    <span>
                      期間: {formatDate(survey.start_date)} - {formatDate(survey.end_date)}
                    </span>
                    <span>
                      回答数: {survey.response_count || 0}件
                    </span>
                    <span>
                      回答率: {getResponseRate(survey)}%
                    </span>
                    <span>
                      匿名: {survey.is_anonymous ? 'あり' : 'なし'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <Link to={`/admin/surveys/${survey.id}/preview`}>
                    <Button variant="secondary" size="sm">
                      プレビュー
                    </Button>
                  </Link>

                  {survey.status === 'draft' && (
                    <Link to={`/admin/surveys/${survey.id}/edit`}>
                      <Button variant="secondary" size="sm">
                        編集
                      </Button>
                    </Link>
                  )}

                  <Link to={`/admin/surveys/${survey.id}/operations`}>
                    <Button variant="warning" size="sm">
                      運用管理
                    </Button>
                  </Link>

                  <Link to={`/admin/analytics?survey=${survey.id}`}>
                    <Button variant="primary" size="sm">
                      結果分析
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {surveys.length === 0 && !loading && (
          <Card variant="default" padding="lg">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                調査がありません
              </h3>
              <p className="text-gray-600 mb-6">
                新しい調査を作成して、組織のエンゲージメントを測定しましょう。
              </p>
              <Link to="/admin/surveys/new">
                <Button variant="primary" size="md">
                  最初の調査を作成
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Pagination */}
        {totalCount > 10 && (
          <div className="flex justify-center">
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                前へ
              </Button>
              
              <span className="px-4 py-2 text-sm text-gray-700">
                {currentPage} / {Math.ceil(totalCount / 10)}
              </span>
              
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage >= Math.ceil(totalCount / 10)}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                次へ
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}