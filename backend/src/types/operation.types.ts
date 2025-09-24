import { z } from 'zod';

// Survey operation status
export const SurveyOperationStatusSchema = z.enum(['draft', 'active', 'paused', 'closed']);
export type SurveyOperationStatus = z.infer<typeof SurveyOperationStatusSchema>;

// Survey operation schema
export const SurveyOperationSchema = z.object({
  surveyId: z.number().positive(),
  status: SurveyOperationStatusSchema,
  startedAt: z.string().datetime().optional(),
  stoppedAt: z.string().datetime().optional(),
  pausedAt: z.string().datetime().optional(),
});
export type SurveyOperation = z.infer<typeof SurveyOperationSchema>;

// Reminder frequency
export const ReminderFrequencySchema = z.enum(['once', 'daily', 'weekly']);
export type ReminderFrequency = z.infer<typeof ReminderFrequencySchema>;

// Reminder settings schema
export const ReminderSettingsSchema = z.object({
  id: z.number().optional(),
  surveyId: z.number().positive(),
  frequency: ReminderFrequencySchema,
  scheduleTime: z.string(),
  message: z.string().min(1).max(1000),
  targetGroups: z.array(z.string()).optional(),
  enabled: z.boolean().default(true),
});

export const CreateReminderSchema = ReminderSettingsSchema.omit({ id: true });
export const UpdateReminderSchema = ReminderSettingsSchema.partial().required({ id: true });

export type ReminderSettings = z.infer<typeof ReminderSettingsSchema>;
export type CreateReminderDto = z.infer<typeof CreateReminderSchema>;
export type UpdateReminderDto = z.infer<typeof UpdateReminderSchema>;

// Department stats schema
export const DepartmentStatsSchema = z.object({
  department: z.string(),
  totalEmployees: z.number().int().nonnegative(),
  responses: z.number().int().nonnegative(),
  responseRate: z.number().min(0).max(100),
});
export type DepartmentStats = z.infer<typeof DepartmentStatsSchema>;

// Daily progress schema
export const DailyProgressSchema = z.object({
  date: z.string(),
  responses: z.number().int().nonnegative(),
  cumulativeResponses: z.number().int().nonnegative(),
});
export type DailyProgress = z.infer<typeof DailyProgressSchema>;

// Participation stats schema
export const ParticipationStatsSchema = z.object({
  totalEmployees: z.number().int().nonnegative(),
  totalResponses: z.number().int().nonnegative(),
  responseRate: z.number().min(0).max(100),
  byDepartment: z.array(DepartmentStatsSchema),
  dailyProgress: z.array(DailyProgressSchema),
});
export type ParticipationStats = z.infer<typeof ParticipationStatsSchema>;

// Operation action schemas
export const StartSurveySchema = z.object({
  surveyId: z.number().positive(),
});

export const StopSurveySchema = z.object({
  surveyId: z.number().positive(),
});

export const PauseSurveySchema = z.object({
  surveyId: z.number().positive(),
});

export const ResumeSurveySchema = z.object({
  surveyId: z.number().positive(),
});