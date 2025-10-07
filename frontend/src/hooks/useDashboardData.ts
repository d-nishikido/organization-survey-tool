import { useMemo } from 'react';
import { useQuery } from 'react-query';
import { differenceInDays } from 'date-fns';
import { surveyService } from '@/api/services/surveyService';
import { sessionManager } from '@/utils/sessionManager';
import type { SurveyWithStatus } from '@/components/dashboard';
import type { DashboardStats } from '@/components/dashboard';

export interface UseDashboardDataReturn {
  surveys: SurveyWithStatus[];
  stats: DashboardStats;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Custom hook for fetching and managing dashboard data
 * Combines survey data from API with completion status from LocalStorage
 */
export function useDashboardData(): UseDashboardDataReturn {
  // Fetch active surveys from API
  const { data: surveysResponse, isLoading, error, refetch } = useQuery(
    ['dashboard-surveys'],
    () => surveyService.getSurveys({ status: 'active' }),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: true,
    }
  );

  // Combine survey data with session status
  const surveys: SurveyWithStatus[] = useMemo(() => {
    if (!surveysResponse?.data) return [];

    return surveysResponse.data.map(survey => {
      const isCompleted = sessionManager.isCompleted(String(survey.id));

      // Calculate if deadline is near (within 3 days)
      const daysUntilDeadline = differenceInDays(
        new Date(survey.end_date),
        new Date()
      );
      const isDeadlineNear = daysUntilDeadline <= 3 && daysUntilDeadline >= 0;

      return {
        ...survey,
        // Convert SurveyResponse to Survey format
        id: String(survey.id),
        description: survey.description || null,
        status: survey.status as 'draft' | 'active' | 'closed' | 'archived',
        start_date: survey.start_date,
        end_date: survey.end_date,
        isCompleted,
        isDeadlineNear,
      };
    });
  }, [surveysResponse]);

  // Calculate statistics
  const stats: DashboardStats = useMemo(() => {
    const totalSurveys = surveys.length;
    const completedSurveys = surveys.filter(s => s.isCompleted).length;
    const completionRate = totalSurveys > 0
      ? Math.round((completedSurveys / totalSurveys) * 100)
      : 0;

    return {
      totalSurveys,
      completedSurveys,
      completionRate,
    };
  }, [surveys]);

  return {
    surveys,
    stats,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
