import { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useSurveyStore } from '@/stores/surveyStore';
import { useAuth } from '@/contexts/AuthContext';

export function SurveyPage(): JSX.Element {
  const { surveyId } = useParams<{ surveyId: string }>();
  const { sessionId } = useAuth();
  const { startSurvey, currentSurvey, progress } = useSurveyStore();

  useEffect(() => {
    if (surveyId && !currentSurvey) {
      // Placeholder: Start survey with 10 questions
      startSurvey(surveyId, 10);
    }
  }, [surveyId, currentSurvey, startSurvey]);

  if (!surveyId) {
    return <Navigate to="/surveys" replace />;
  }

  const surveyProgress = progress[surveyId];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-12 px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {surveyId === 'engagement-2024' ? '従業員エンゲージメント調査 2024' : '調査'}
            </h1>
            
            {sessionId && (
              <p className="text-sm text-gray-600">
                匿名セッション: {sessionId.substring(0, 16)}...
              </p>
            )}

            {surveyProgress && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>進捗状況</span>
                  <span>{surveyProgress.currentQuestionIndex + 1} / {surveyProgress.totalQuestions}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${((surveyProgress.currentQuestionIndex + 1) / surveyProgress.totalQuestions) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">
              開発中
            </h2>
            <p className="text-yellow-700">
              調査機能は現在開発中です。実際の質問フォームは別のイシューで実装予定です。
            </p>
            
            {surveyProgress && (
              <div className="mt-4 p-4 bg-white rounded border">
                <h3 className="font-medium text-gray-900 mb-2">デバッグ情報:</h3>
                <pre className="text-sm text-gray-600">
                  {JSON.stringify(surveyProgress, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-between">
            <button
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              onClick={() => window.history.back()}
            >
              戻る
            </button>
            
            <div className="space-x-4">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                disabled
              >
                前の質問
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled
              >
                次の質問
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}