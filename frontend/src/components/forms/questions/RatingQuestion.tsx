import { Question } from '@/types/survey';

interface RatingQuestionProps {
  question: Question;
  value?: number;
  onChange: (value: number) => void;
  error?: string;
}

export function RatingQuestion({
  question,
  value,
  onChange,
  error
}: RatingQuestionProps): JSX.Element {
  const maxRating = 5; // 5-point rating scale

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className={`
              w-12 h-12 rounded-full border-2 font-semibold transition-all
              ${value === rating
                ? 'bg-blue-500 text-white border-blue-500 shadow-lg transform scale-110'
                : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
              }
            `}
            aria-label={`評価 ${rating}`}
          >
            {rating}
          </button>
        ))}
      </div>

      {/* Rating labels */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>低い</span>
        <span className="text-center">普通</span>
        <span>高い</span>
      </div>

      {error && (
        <div className="text-red-500 text-sm mt-2">{error}</div>
      )}
    </div>
  );
}