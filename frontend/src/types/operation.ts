export type SurveyOperationStatus = 'draft' | 'active' | 'paused' | 'closed';

export interface SurveyOperation {
  surveyId: number;
  status: SurveyOperationStatus;
  startedAt?: string;
  stoppedAt?: string;
  pausedAt?: string;
}

export type ReminderFrequency = 'once' | 'daily' | 'weekly';

export interface ReminderSettings {
  id?: number;
  surveyId: number;
  frequency: ReminderFrequency;
  scheduleTime: string;
  message: string;
  targetGroups?: string[];
  enabled: boolean;
}

export interface DepartmentStats {
  department: string;
  totalEmployees: number;
  responses: number;
  responseRate: number;
}

export interface DailyProgress {
  date: string;
  responses: number;
  cumulativeResponses: number;
}

export interface ParticipationStats {
  totalEmployees: number;
  totalResponses: number;
  responseRate: number;
  byDepartment: DepartmentStats[];
  dailyProgress: DailyProgress[];
}

export interface OperationLog {
  id: number;
  survey_id: number;
  action: string;
  performed_at: string;
  performed_by?: string;
  details?: Record<string, any>;
}