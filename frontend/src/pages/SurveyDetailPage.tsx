import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SurveyService } from '@/api/services';
import { operationService } from '@/api/services';
import { Survey } from '@/types/survey';
import { EmployeeLayout } from '@/components/common';

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
    <EmployeeLayout>
      <div className="container mx-auto py-12 px-4">
        <div className="mb-8">
          <Link 
            to="/surveys" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            調査一覧に戻る
          </Link>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900">{survey?.title}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                survey?.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {survey?.status === 'active' ? '実施中' : '停止中'}
              </span>
            </div>

            {survey?.description && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">調査の概要</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {survey.description}
                </p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-3">調査詳細</h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">実施期間:</dt>
                    <dd className="text-gray-900">
                      {survey?.startDate && new Date(survey.startDate).toLocaleDateString('ja-JP')} 
                      {survey?.endDate && ` - ${new Date(survey.endDate).toLocaleDateString('ja-JP')}`}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">作成日:</dt>
                    <dd className="text-gray-900">
                      {survey?.createdAt && new Date(survey.createdAt).toLocaleDateString('ja-JP')}
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-md font-semibold text-gray-900 mb-3">参加状況</h3>
                {sessionId && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <p className="text-blue-700 text-sm">
                      匿名セッション: {sessionId.substring(0, 16)}...
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleStartSurvey}
                  disabled={survey?.status !== 'active'}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {survey?.status === 'active' ? '調査を開始する' : '調査は現在停止中です'}
                </button>
                
                <button
                  onClick={() => navigate('/surveys')}
                  className="flex-1 sm:flex-none bg-gray-200 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}