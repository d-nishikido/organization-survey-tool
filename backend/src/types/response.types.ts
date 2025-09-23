import { z } from 'zod';

export const SubmitResponseSchema = z.object({
  survey_id: z.number().positive(),
  session_id: z.string().uuid(),
  responses: z.array(
    z.object({
      question_id: z.number().positive(),
      answer: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
    }),
  ),
});

export const ResponseProgressSchema = z.object({
  survey_id: z.number(),
  session_id: z.string().uuid(),
  total_questions: z.number(),
  answered_questions: z.number(),
  progress_percentage: z.number(),
  last_updated: z.string(),
});

export const ResponseConfirmationSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  response_id: z.string(),
  submitted_at: z.string(),
});

export type SubmitResponseDto = z.infer<typeof SubmitResponseSchema>;
export type ResponseProgress = z.infer<typeof ResponseProgressSchema>;
export type ResponseConfirmation = z.infer<typeof ResponseConfirmationSchema>;
