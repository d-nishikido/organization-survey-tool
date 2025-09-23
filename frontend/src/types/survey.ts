export interface SurveyQuestion {
  id: string;
  type: 'multiple_choice' | 'scale' | 'text' | 'yes_no';
  question: string;
  options?: string[];
  required: boolean;
  category: string;
}

export interface SurveyResponse {
  questionId: string;
  value: string | number;
  timestamp: Date;
}

export interface SurveyProgress {
  surveyId: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  responses: Record<string, SurveyResponse>;
  isCompleted: boolean;
  startedAt: Date;
  lastUpdated: Date;
}

export interface SurveyState {
  currentSurvey: string | null;
  progress: Record<string, SurveyProgress>;
  isSubmitting: boolean;
  error: string | null;
}

export interface SurveyActions {
  startSurvey: (surveyId: string, totalQuestions: number) => void;
  saveResponse: (surveyId: string, questionId: string, value: string | number) => void;
  nextQuestion: (surveyId: string) => void;
  previousQuestion: (surveyId: string) => void;
  completeSurvey: (surveyId: string) => void;
  setSubmitting: (submitting: boolean) => void;
  setError: (error: string | null) => void;
  clearProgress: (surveyId: string) => void;
}