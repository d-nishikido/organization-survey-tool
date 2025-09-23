export type SurveyStatus = 'draft' | 'active' | 'closed' | 'archived';

export interface CreateSurveyDto {
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  is_anonymous?: boolean;
  status?: SurveyStatus;
}

export interface UpdateSurveyDto extends Partial<CreateSurveyDto> {}

export interface SurveyResponse {
  id: number;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  is_anonymous: boolean;
  status: SurveyStatus;
  created_at: string;
  updated_at: string;
  response_count?: number;
}

export interface SurveyList {
  data: SurveyResponse[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SurveyQuery {
  page?: number;
  pageSize?: number;
  status?: SurveyStatus;
  search?: string;
}

// Legacy Survey interface for backward compatibility
export interface Survey {
  id: string;
  title: string;
  description: string | null;
  status: 'draft' | 'active' | 'closed' | 'archived';
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  questionCount?: number;
  response_count?: number;
}

export interface Question {
  id: string;
  type: 'multiple_choice' | 'scale' | 'text' | 'yes_no';
  question: string;
  options?: string[];
  required: boolean;
  category: string;
  order?: number;
}

export interface SurveyQuestion extends Question {
  surveyId: string;
}

export interface SurveyResponseData {
  questionId: string;
  value: string | number;
  timestamp: Date;
}

export interface SurveyProgress {
  surveyId: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  responses: Record<string, SurveyResponseData>;
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