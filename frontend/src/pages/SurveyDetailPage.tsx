import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SurveyService } from '@/api/services';
import { operationService } from '@/api/services';
import { Survey } from '@/types/survey';

export function SurveyDetailPage(): JSX.Element {
  const { surveyId } = useParams<{ surveyId: string }>();
  const { sessionId } = useAuth();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (surveyId) {
      loadSurveyDetails();
    }
  }, [surveyId]);

  const loadSurveyDetails = async () => {
    if (!surveyId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await SurveyService.getSurveyById(surveyId);
      setSurvey(response.data);
    } catch (err) {
      setError('調査の詳細情報の読み込みに失敗しました。');
      console.error('Failed to load survey details:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Survey['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            実施中
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            準備中
          </span>
        );
      case 'closed':
      case 'archived':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            終了
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStartSurvey = async () => {
    if (!surveyId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Start the survey through the operation service
      await operationService.startSurvey(Number(surveyId));
      
      // Reload survey details to get updated status
      await loadSurveyDetails();
      
      // Navigate to the survey page
      navigate(`/survey/${surveyId}`);
    } catch (err: any) {
      console.error('Failed to start survey:', err);
      setError('調査の開始に失敗しました。再度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-12 px-4">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-12 px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">エラーが発生しました</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error || '調査が見つかりませんでした。'}</p>
                </div>
                <div className="mt-4 space-x-2">
                  <button
                    onClick={loadSurveyDetails}
                    className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                  >
                    再試行
                  </button>
                  <Link
                    to="/surveys"
                    className="bg-gray-100 px-3 py-2 rounded-md text-sm font-medium text-gray-800 hover:bg-gray-200"
                  >
                    調査一覧に戻る
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-12 px-4">
        {/* Breadcrumb */}
        <nav className="flex mb-8">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            <li className="inline-flex items-center">
              <Link to="/surveys" className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600">
                調査一覧
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="ml-1 text-sm font-medium text-gray-500">{survey.title}</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Survey Details */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {survey.title}
                </h1>
                <div className="flex items-center space-x-4">
                  {getStatusBadge(survey.status)}
                </div>
              </div>
            </div>

            <div className="prose prose-gray max-w-none mb-8">
              <p className="text-lg text-gray-600 leading-relaxed">
                {survey.description || '詳細な説明はありません。'}
              </p>
            </div>

            {/* Survey Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-500">回答数</div>
                <div className="text-2xl font-bold text-gray-900">
                  {survey.response_count || 0}件
                </div>
              </div>

              {survey.questionCount && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-500">質問数</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {survey.questionCount}問
                  </div>
                </div>
              )}

              {survey.start_date && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-500">開始日</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatDate(survey.start_date)}
                  </div>
                </div>
              )}

              {survey.end_date && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-gray-500">終了日</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatDate(survey.end_date)}
                  </div>
                </div>
              )}
            </div>

            {/* Session Information */}
            {sessionId && (
              <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-2">セッション情報</h3>
                <p className="text-sm text-blue-700">
                  匿名セッションID: {sessionId.substring(0, 16)}...
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  このセッションIDにより、回答の重複を防ぎます。
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {survey.status === 'active' ? (
                <button
                  onClick={handleStartSurvey}
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h6a2 2 0 012 2v8a2 2 0 01-2 2H9a2 2 0 01-2-2v-8a2 2 0 012-2z" />
                  </svg>
                  調査を開始する
                </button>
              ) : (survey.status === 'closed' || survey.status === 'archived') ? (
                <Link
                  to={`/results/${survey.id}`}
                  className="px-6 py-3 border border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  結果を確認する
                </Link>
              ) : (
                <button
                  disabled
                  className="px-6 py-3 border border-gray-300 text-gray-400 font-medium rounded-lg bg-gray-100 cursor-not-allowed flex items-center justify-center"
                >
                  近日公開予定
                </button>
              )}

              <Link
                to="/surveys"
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
              >
                調査一覧に戻る
              </Link>
            </div>

            {/* Additional Information */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-500 space-y-1">
                <p>作成日: {formatDateTime(survey.created_at)}</p>
                <p>最終更新: {formatDateTime(survey.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}