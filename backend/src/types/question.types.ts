import { z } from 'zod';

export const QuestionType = z.enum([
  'text',
  'textarea',
  'radio',
  'checkbox',
  'select',
  'rating',
  'scale',
  'boolean',
]);
export type QuestionType = z.infer<typeof QuestionType>;

export const QuestionCategory = z.enum([
  'engagement',
  'satisfaction',
  'leadership',
  'culture',
  'growth',
  'worklife',
  'communication',
  'other',
]);
export type QuestionCategory = z.infer<typeof QuestionCategory>;

export const CreateQuestionSchema = z.object({
  question: z.string().min(1).max(1000),
  type: QuestionType,
  category: QuestionCategory,
  is_required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  min_value: z.number().optional(),
  max_value: z.number().optional(),
  min_label: z.string().optional(),
  max_label: z.string().optional(),
});

export const UpdateQuestionSchema = CreateQuestionSchema.partial();

export const QuestionResponseSchema = z.object({
  id: z.number(),
  question: z.string(),
  type: QuestionType,
  category: QuestionCategory,
  is_required: z.boolean(),
  options: z.array(z.string()).nullable(),
  min_value: z.number().nullable(),
  max_value: z.number().nullable(),
  min_label: z.string().nullable(),
  max_label: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const QuestionListSchema = z.object({
  data: z.array(QuestionResponseSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export const QuestionQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  category: QuestionCategory.optional(),
  type: QuestionType.optional(),
  search: z.string().optional(),
});

export type CreateQuestionDto = z.infer<typeof CreateQuestionSchema>;
export type UpdateQuestionDto = z.infer<typeof UpdateQuestionSchema>;
export type QuestionResponse = z.infer<typeof QuestionResponseSchema>;
export type QuestionList = z.infer<typeof QuestionListSchema>;
export type QuestionQuery = z.infer<typeof QuestionQuerySchema>;
