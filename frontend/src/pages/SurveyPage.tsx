import { useEffect, useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useSurveyStore } from '@/stores/surveyStore';
import { useAuth } from '@/contexts/AuthContext';
import { SurveyService } from '@/api/services';
import { Question, Survey } from '@/types/survey';
import { QuestionForm } from '@/components/forms/QuestionForm';
import { ProgressBar } from '@/components/common/ProgressBar';

export function SurveyPage(): JSX.Element {
  const { surveyId } = useParams<{ surveyId: string }>();
  const { sessionId } = useAuth();
  const { 
    startSurvey, 
    currentSurvey, 
    progress, 
    saveResponse, 
    nextQuestion, 
    previousQuestion,
    completeSurvey,
    isSubmitting,
    error 
  } = useSurveyStore();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (surveyId) {
      loadSurveyData();
    }
  }, [surveyId]);

  const loadSurveyData = async () => {
    if (!surveyId) return;
    
    try {
      setLoading(true);
      setApiError(null);
      
      // Load survey details and questions in parallel
      const [surveyResponse, questionsResponse] = await Promise.all([
        SurveyService.getSurveyById(surveyId),
        SurveyService.getSurveyQuestions(surveyId)
      ]);
      
      setSurvey(surveyResponse.data);
      setQuestions(questionsResponse.data);
      
      // Start survey if not already started
      if (!currentSurvey || currentSurvey !== surveyId) {
        startSurvey(surveyId, questionsResponse.data.length);
      }
    } catch (err) {
      console.error('Failed to load survey data:', err);
      setApiError('調査データの読み込みに失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (questionId: string, value: string | number) => {
    if (!surveyId) return;
    saveResponse(surveyId, questionId, value);
  };

  const handleNext = () => {
    if (!surveyId || !surveyProgress) return;
    
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;
    
    // Validate required question
    const currentResponse = surveyProgress.responses[currentQuestion.id];
    if (currentQuestion.required && (!currentResponse || !currentResponse.value)) {
      return; // Let the QuestionForm show the error
    }
    
    if (surveyProgress.currentQuestionIndex < surveyProgress.totalQuestions - 1) {
      nextQuestion(surveyId);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (!surveyId) return;
    previousQuestion(surveyId);
  };

  const handleComplete = async () => {
    if (!surveyId || !surveyProgress) return;
    
    try {
      // Submit all responses to backend
      const responses: Record<string, any> = {};
      Object.entries(surveyProgress.responses).forEach(([questionId, response]) => {
        responses[questionId] = response.value;
      });
      
      await SurveyService.submitResponse(surveyId, responses);
      completeSurvey(surveyId);
      
      // Navigate to completion page
      navigate(`/survey/${surveyId}/complete`);
    } catch (err) {
      console.error('Failed to submit survey:', err);
      setApiError('回答の送信に失敗しました。後でもう一度お試しください。');
    }
  };

  if (!surveyId) {
    return <Navigate to="/surveys" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-12 px-4 max-w-4xl">
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (apiError || !survey) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-12 px-4 max-w-4xl">
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
                  <p>{apiError || '調査が見つかりませんでした。'}</p>
                </div>
                <div className="mt-4 space-x-2">
                  <button
                    onClick={loadSurveyData}
                    className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                  >
                    再試行
                  </button>
                  <button
                    onClick={() => navigate('/surveys')}
                    className="bg-gray-100 px-3 py-2 rounded-md text-sm font-medium text-gray-800 hover:bg-gray-200"
                  >
                    調査一覧に戻る
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const surveyProgress = progress[surveyId];
  const getCurrentQuestion = (): Question | undefined => {
    if (!surveyProgress || questions.length === 0) return undefined;
    return questions[surveyProgress.currentQuestionIndex];
  };

  const currentQuestion = getCurrentQuestion();
  const isLastQuestion = surveyProgress && surveyProgress.currentQuestionIndex >= surveyProgress.totalQuestions - 1;
  const canGoNext = currentQuestion && (!currentQuestion.required || 
    (surveyProgress?.responses[currentQuestion.id]?.value !== undefined &&
     surveyProgress?.responses[currentQuestion.id]?.value !== ''));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-12 px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Survey Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {survey.title}
            </h1>
            
            {sessionId && (
              <p className="text-sm text-gray-600 mb-4">
                匿名セッション: {sessionId.substring(0, 16)}...
              </p>
            )}

            {surveyProgress && (
              <ProgressBar
                current={surveyProgress.currentQuestionIndex + 1}
                total={surveyProgress.totalQuestions}
                className="mb-4"
              />
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Question Display */}
          {currentQuestion && surveyProgress && (
            <div className="mb-8">
              <QuestionForm
                question={currentQuestion}
                value={surveyProgress.responses[currentQuestion.id]?.value}
                onChange={(value) => handleResponseChange(currentQuestion.id, value)}
              />
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => navigate('/surveys')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              調査一覧に戻る
            </button>
            
            <div className="space-x-4">
              <button
                onClick={handlePrevious}
                disabled={!surveyProgress || surveyProgress.currentQuestionIndex === 0}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                前の質問
              </button>
              <button
                onClick={handleNext}
                disabled={isSubmitting || !canGoNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    送信中...
                  </span>
                ) : isLastQuestion ? (
                  '回答を送信'
                ) : (
                  '次の質問'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}