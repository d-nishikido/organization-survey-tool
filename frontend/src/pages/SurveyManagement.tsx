import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../components/admin';
import { Card, Button, Input, Loading, Alert } from '../components/ui';
import type { SurveyResponse } from '../types/survey';
import { SurveyService } from '../api/services/surveyService';

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

// Memoized search filters component
const SearchFilters = memo(({ 
  searchTerm, 
  statusFilter, 
  onSearchChange, 
  onStatusChange, 
  onClearFilters 
}: {
  searchTerm: string;
  statusFilter: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (status: string) => void;
  onClearFilters: () => void;
}) => {
  return (
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
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ステータス
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
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
            onClick={onClearFilters}
          >
            フィルタをクリア
          </Button>
        </div>
      </div>
    </Card>
  );
});

SearchFilters.displayName = 'SearchFilters';

// Memoized survey list component
const SurveysList = memo(({ 
  surveys, 
  loading, 
  formatDate, 
  getResponseRate,
  onDelete
}: {
  surveys: SurveyResponse[];
  loading: boolean;
  formatDate: (dateString: string) => string;
  getResponseRate: (survey: SurveyResponse) => string;
  onDelete: (surveyId: number) => Promise<void>;
}) => {
  if (surveys.length === 0 && !loading) {
    return (
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
    );
  }

  return (
    <div className="space-y-4">
      {surveys.map((survey) => (
        <SurveyCard
          key={survey.id}
          survey={survey}
          formatDate={formatDate}
          getResponseRate={getResponseRate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
});

SurveysList.displayName = 'SurveysList';

// Memoized individual survey card
const SurveyCard = memo(({ 
  survey, 
  formatDate, 
  getResponseRate,
  onDelete
}: {
  survey: SurveyResponse;
  formatDate: (dateString: string) => string;
  getResponseRate: (survey: SurveyResponse) => string;
  onDelete: (surveyId: number) => Promise<void>;
}) => {
  return (
    <Card variant="default" padding="md">
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
            <>
              <Link to={`/admin/surveys/${survey.id}/edit`}>
                <Button variant="secondary" size="sm">
                  編集
                </Button>
              </Link>
              <Link to={`/admin/surveys/${survey.id}/questions`}>
                <Button variant="secondary" size="sm">
                  質問管理
                </Button>
              </Link>
              <Button
                variant="danger"
                size="sm"
                onClick={() => onDelete(survey.id)}
              >
                削除
              </Button>
            </>
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
  );
});

SurveyCard.displayName = 'SurveyCard';

// Memoized pagination component
const Pagination = memo(({ 
  currentPage, 
  totalPages, 
  isFirstPage, 
  isLastPage, 
  onPreviousPage, 
  onNextPage 
}: {
  currentPage: number;
  totalPages: number;
  isFirstPage: boolean;
  isLastPage: boolean;
  onPreviousPage: () => void;
  onNextPage: () => void;
}) => {
  return (
    <div className="flex justify-center">
      <div className="flex items-center space-x-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={isFirstPage}
          onClick={onPreviousPage}
        >
          前へ
        </Button>
        
        <span className="px-4 py-2 text-sm text-gray-700">
          {currentPage} / {totalPages}
        </span>
        
        <Button
          variant="secondary"
          size="sm"
          disabled={isLastPage}
          onClick={onNextPage}
        >
          次へ
        </Button>
      </div>
    </div>
  );
});

Pagination.displayName = 'Pagination';

export function SurveyManagement(): JSX.Element {
  const [surveys, setSurveys] = useState<SurveyResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced search term to avoid excessive API calls
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // Wait 300ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchSurveys = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch real data from API
      const params: any = {
        page: currentPage,
        pageSize: 10,
      };
      
      if (statusFilter) {
        params.status = statusFilter;
      }
      
      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm;
      }
      
      const response = await SurveyService.getSurveys(params);
      
      setSurveys(response.data);
      setTotalCount(response.total);
    } catch (err) {
      setError('調査の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, statusFilter]); // Only depend on debounced search term

  useEffect(() => {
    fetchSurveys();
  }, [fetchSurveys]);

  // Memoized event handlers to prevent unnecessary re-renders
  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, []);

  const handleStatusFilter = useCallback((status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('');
    setCurrentPage(1);
  }, []);

  const handlePreviousPage = useCallback(() => {
    setCurrentPage(currentPage - 1);
  }, [currentPage]);

  const handleNextPage = useCallback(() => {
    setCurrentPage(currentPage + 1);
  }, [currentPage]);

  const handleDeleteSurvey = useCallback(async (surveyId: number) => {
    if (!confirm('この調査を削除しますか？この操作は取り消せません。')) {
      return;
    }

    try {
      setLoading(true);
      await SurveyService.deleteSurvey(surveyId.toString());
      
      // Refresh the surveys list
      await fetchSurveys();
      
      // Show success message (could be replaced with a toast notification)
      alert('調査が正常に削除されました。');
    } catch (err: any) {
      // Handle error
      const errorMessage = err?.response?.data?.error?.message || '調査の削除に失敗しました';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchSurveys]);

  // Memoized computed values
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  }, []);

  const getResponseRate = useCallback((survey: SurveyResponse) => {
    // 仮の計算 - 実際の従業員数は別途取得が必要
    const estimatedEmployees = 1000;
    const responseCount = survey.response_count || 0;
    return ((responseCount / estimatedEmployees) * 100).toFixed(1);
  }, []);

  // Memoized pagination info
  const paginationInfo = useMemo(() => ({
    totalPages: Math.ceil(totalCount / 10),
    showPagination: totalCount > 10,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage >= Math.ceil(totalCount / 10),
  }), [totalCount, currentPage]);

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

        {/* Filters - Memoized component */}
        <SearchFilters
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          onSearchChange={handleSearch}
          onStatusChange={handleStatusFilter}
          onClearFilters={handleClearFilters}
        />

        {/* Error Display */}
        {error && (
          <Alert variant="danger" title="エラー">
            調査の取得に失敗しました。再度お試しください。
          </Alert>
        )}

        {/* Surveys List - Memoized component */}
        <SurveysList
          surveys={surveys}
          loading={loading}
          formatDate={formatDate}
          getResponseRate={getResponseRate}
          onDelete={handleDeleteSurvey}
        />

        {/* Pagination */}
        {paginationInfo.showPagination && (
          <Pagination
            currentPage={currentPage}
            totalPages={paginationInfo.totalPages}
            isFirstPage={paginationInfo.isFirstPage}
            isLastPage={paginationInfo.isLastPage}
            onPreviousPage={handlePreviousPage}
            onNextPage={handleNextPage}
          />
        )}
      </div>
    </AdminLayout>
  );
}