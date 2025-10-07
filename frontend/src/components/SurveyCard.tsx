import { Link } from 'react-router-dom';
import { Survey } from '@/types/survey';

interface SurveyCardProps {
  survey: Survey;
  isCompleted?: boolean;
  isDeadlineNear?: boolean;
  onClick?: (surveyId: string | number) => void;
  variant?: 'default' | 'compact';
}

export function SurveyCard({
  survey,
  isCompleted = false,
  isDeadlineNear = false,
  onClick,
  variant = 'default'
}: SurveyCardProps): JSX.Element {
  const getStatusBadge = (status: Survey['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
            実施中
          </span>
        );
      case 'draft':
        return (
          <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
            準備中
          </span>
        );
      case 'closed':
      case 'archived':
        return (
          <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
            終了
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const paddingClass = variant === 'compact' ? 'p-4' : 'p-6';
  const opacityClass = isCompleted ? 'opacity-60' : '';

  return (
    <div className={`bg-white rounded-lg shadow-lg ${paddingClass} transition-shadow hover:shadow-xl ${opacityClass}`}>
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-xl font-semibold text-gray-800">
          {survey.title}
        </h3>
        {isCompleted && (
          <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full ml-2 flex-shrink-0">
            ✓ 回答済み
          </span>
        )}
        {isDeadlineNear && !isCompleted && (
          <span className="inline-block bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full ml-2 flex-shrink-0">
            ⚠ 期限間近
          </span>
        )}
      </div>
      <p className="text-gray-600 mb-4 line-clamp-3">
        {survey.description || '説明がありません'}
      </p>

      <div className="mb-4 space-y-2">
        {getStatusBadge(survey.status)}
        
        {survey.response_count !== undefined && (
          <div className="text-sm text-gray-600">
            回答数: {survey.response_count}件
          </div>
        )}
        
        {survey.questionCount !== undefined && (
          <div className="text-sm text-gray-600">
            質問数: {survey.questionCount}問
          </div>
        )}
        
        {survey.start_date && (
          <div className="text-sm text-gray-600">
            開始: {formatDate(survey.start_date)}
          </div>
        )}
        
        {survey.end_date && (
          <div className="text-sm text-gray-600">
            終了: {formatDate(survey.end_date)}
          </div>
        )}
      </div>

      <div className="flex space-x-2">
        {survey.status === 'active' ? (
          isCompleted ? (
            <button
              disabled
              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-400 bg-gray-100 cursor-not-allowed"
            >
              調査を開始
            </button>
          ) : onClick ? (
            <button
              onClick={() => onClick(survey.id)}
              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              調査を開始
            </button>
          ) : (
            <Link
              to={`/survey/${survey.id}`}
              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              調査を開始
            </Link>
          )
        ) : (survey.status === 'closed' || survey.status === 'archived') ? (
          <Link
            to={`/results/${survey.id}`}
            className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-blue-600 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 transition-colors"
          >
            結果を見る
          </Link>
        ) : (
          <button
            disabled
            className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-400 bg-gray-100 cursor-not-allowed"
          >
            近日公開
          </button>
        )}
        
        <Link
          to={`/survey/${survey.id}/details`}
          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          詳細
        </Link>
      </div>
    </div>
  );
}