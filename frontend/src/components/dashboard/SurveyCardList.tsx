import { SurveyCard } from '../SurveyCard';
import type { Survey } from '@/types/survey';

export interface SurveyWithStatus extends Survey {
  isCompleted: boolean;
  isDeadlineNear: boolean;
}

export interface SurveyCardListProps {
  surveys: SurveyWithStatus[];
  onSurveyClick?: (surveyId: string | number, isCompleted: boolean) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export function SurveyCardList({
  surveys,
  onSurveyClick,
  loading = false,
  emptyMessage = '現在、回答可能な調査はありません。',
}: SurveyCardListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((index) => (
          <div key={index} className="bg-white rounded-lg shadow-lg p-6 animate-pulse" data-testid="skeleton">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  if (surveys.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {surveys.map((survey) => (
        <SurveyCard
          key={survey.id}
          survey={survey}
          isCompleted={survey.isCompleted}
          isDeadlineNear={survey.isDeadlineNear}
          onClick={onSurveyClick ? (surveyId) => onSurveyClick(surveyId, survey.isCompleted) : undefined}
        />
      ))}
    </div>
  );
}
