import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Shield, Users, BarChart3 } from 'lucide-react';

interface CompletionData {
  surveyId: number;
  sessionId: string;
  submittedAt: string;
}

const SurveyCompletion: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isAnimated, setIsAnimated] = useState(false);
  const [completionData, setCompletionData] = useState<CompletionData | null>(null);

  useEffect(() => {
    // Get completion data from URL params or localStorage
    const surveyId = searchParams.get('surveyId');
    const sessionId = searchParams.get('sessionId');
    const submittedAt = searchParams.get('submittedAt');

    if (surveyId && sessionId && submittedAt) {
      setCompletionData({
        surveyId: parseInt(surveyId),
        sessionId,
        submittedAt,
      });
    } else {
      // Try to get from localStorage as fallback
      const storedData = localStorage.getItem('survey_completion');
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          setCompletionData(parsed);
        } catch (error) {
          console.error('Failed to parse completion data:', error);
        }
      }
    }

    // Clean up localStorage after completion
    cleanupSessionData();

    // Trigger animation
    const timer = setTimeout(() => {
      setIsAnimated(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [searchParams]);

  const cleanupSessionData = () => {
    try {
      // Remove session-related data from localStorage
      localStorage.removeItem('survey_session_token');
      localStorage.removeItem('survey_progress');
      localStorage.removeItem('survey_responses');
      localStorage.removeItem('survey_completion');
      
      // Clear any survey-related session storage
      sessionStorage.clear();
    } catch (error) {
      console.error('Failed to cleanup session data:', error);
    }
  };

  const handleReturnHome = () => {
    navigate('/');
  };

  const handleViewResults = () => {
    if (completionData) {
      navigate(`/analytics?surveyId=${completionData.surveyId}`);
    }
  };

  const formatSubmissionTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return timestamp;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Main completion card */}
        <div
          className={`bg-white rounded-lg shadow-xl p-8 text-center transform transition-all duration-1000 ${
            isAnimated ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        >
          {/* Success icon with animation */}
          <div className="mb-6">
            <div
              className={`inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full transform transition-all duration-1000 delay-300 ${
                isAnimated ? 'scale-100 rotate-0' : 'scale-0 rotate-180'
              }`}
            >
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>

          {/* Completion message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            回答完了
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            アンケートへのご協力ありがとうございました。<br />
            あなたの貴重なご意見を受け取りました。
          </p>

          {/* Completion details */}
          {completionData && (
            <div
              className={`bg-gray-50 rounded-lg p-4 mb-8 transform transition-all duration-1000 delay-500 ${
                isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
            >
              <div className="text-sm text-gray-500 mb-2">回答完了日時</div>
              <div className="text-lg font-semibold text-gray-900">
                {formatSubmissionTime(completionData.submittedAt)}
              </div>
            </div>
          )}

          {/* Anonymous guarantee section */}
          <div
            className={`bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 transform transition-all duration-1000 delay-700 ${
              isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            <div className="flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-blue-600 mr-3" />
              <h3 className="text-xl font-semibold text-blue-900">
                完全匿名性の保証
              </h3>
            </div>
            <div className="text-left text-blue-800 space-y-2">
              <p className="flex items-start">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                あなたの回答は完全に匿名化されており、個人を特定することはできません
              </p>
              <p className="flex items-start">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                セッション情報は自動的に削除され、重複回答は技術的に防止されています
              </p>
              <p className="flex items-start">
                <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                回答データは組織改善のためのみに使用されます
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div
            className={`space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center transform transition-all duration-1000 delay-1000 ${
              isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            <button
              onClick={handleReturnHome}
              className="w-full sm:w-auto px-8 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              ホームに戻る
            </button>
            <button
              onClick={handleViewResults}
              className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center"
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              集計結果を見る
            </button>
          </div>
        </div>

        {/* Additional information card */}
        <div
          className={`bg-white rounded-lg shadow-lg p-6 mt-6 transform transition-all duration-1000 delay-1200 ${
            isAnimated ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
        >
          <div className="flex items-center mb-4">
            <Users className="w-6 h-6 text-indigo-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">
              次のステップ
            </h3>
          </div>
          <div className="text-gray-600 space-y-3">
            <p>
              • 集計結果は回答期間終了後に管理者より共有される予定です
            </p>
            <p>
              • 組織改善に向けた具体的なアクションプランが策定されます
            </p>
            <p>
              • 継続的な改善のため、定期的な調査を実施する場合があります
            </p>
          </div>
        </div>

        {/* Technical info (only in development) */}
        {process.env.NODE_ENV === 'development' && completionData && (
          <div className="bg-gray-100 rounded-lg p-4 mt-4 text-xs text-gray-500">
            <div className="font-mono">
              <div>Survey ID: {completionData.surveyId}</div>
              <div>Session: {completionData.sessionId.substring(0, 8)}...</div>
              <div>Submitted: {completionData.submittedAt}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SurveyCompletion;