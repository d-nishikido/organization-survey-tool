export type QuestionType =
  | 'text'
  | 'textarea'
  | 'radio'
  | 'checkbox'
  | 'select'
  | 'rating'
  | 'scale'
  | 'boolean';

// Updated to match database category codes (A, B, C, D, E, F, G)
export type QuestionCategory =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G';

export interface CreateQuestionDto {
  question: string;
  type: QuestionType;
  category: QuestionCategory;
  is_required?: boolean;
  options?: string[];
  min_value?: number;
  max_value?: number;
  min_label?: string;
  max_label?: string;
}

export interface UpdateQuestionDto extends Partial<CreateQuestionDto> {}

export interface QuestionResponse {
  id: number;
  question: string;
  type: QuestionType;
  category: QuestionCategory;
  is_required: boolean;
  options: string[] | null;
  min_value: number | null;
  max_value: number | null;
  min_label: string | null;
  max_label: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuestionList {
  data: QuestionResponse[];
  total: number;
  page: number;
  pageSize: number;
}

export interface QuestionQuery {
  page?: number;
  pageSize?: number;
  category?: QuestionCategory;
  type?: QuestionType;
  search?: string;
}