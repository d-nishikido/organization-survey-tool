import { z } from 'zod';

export const SurveyStatus = z.enum(['draft', 'active', 'closed', 'archived']);
export type SurveyStatus = z.infer<typeof SurveyStatus>;

export const CreateSurveySchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  is_anonymous: z.boolean().default(true),
  status: SurveyStatus.default('draft'),
});

export const UpdateSurveySchema = CreateSurveySchema.partial();

export const SurveyResponseSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  start_date: z.string(),
  end_date: z.string(),
  is_anonymous: z.boolean(),
  status: SurveyStatus,
  created_at: z.string(),
  updated_at: z.string(),
  response_count: z.number().optional(),
});

export const SurveyListSchema = z.object({
  data: z.array(SurveyResponseSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export const SurveyQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  status: SurveyStatus.optional(),
  search: z.string().optional(),
});

export type CreateSurveyDto = z.infer<typeof CreateSurveySchema>;
export type UpdateSurveyDto = z.infer<typeof UpdateSurveySchema>;
export type SurveyResponse = z.infer<typeof SurveyResponseSchema>;
export type SurveyList = z.infer<typeof SurveyListSchema>;
export type SurveyQuery = z.infer<typeof SurveyQuerySchema>;
