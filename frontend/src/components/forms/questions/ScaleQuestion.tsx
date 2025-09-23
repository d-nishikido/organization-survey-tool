
import { Question } from '@/types/survey';

interface ScaleQuestionProps {
  question: Question;
  value?: number;
  onChange: (value: number) => void;
  error?: string;
}

export function ScaleQuestion({
  question,
  value,
  onChange,
  error
}: ScaleQuestionProps): JSX.Element {
  // Default scale 1-5 unless options specify otherwise
  const scaleOptions = question.options || ['1', '2', '3', '4', '5'];
  const labels = ['非常に不満', '不満', '普通', '満足', '非常に満足'];

  const handleChange = (selectedValue: number) => {
    onChange(selectedValue);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {/* Scale buttons */}
        <div className="flex justify-between items-center space-x-2">
          {scaleOptions.map((option, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleChange(parseInt(option))}
              className={`
                flex-1 py-3 px-4 text-center rounded-lg border transition-colors font-medium
                ${value === parseInt(option)
                  ? 'border-blue-500 bg-blue-500 text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                }
                ${error ? 'border-red-300' : ''}
              `}
            >
              <div className="text-lg font-bold">{option}</div>
            </button>
          ))}
        </div>

        {/* Scale labels */}
        <div className="flex justify-between text-xs text-gray-500 px-2">
          <span>{labels[0]}</span>
          <span>{labels[labels.length - 1]}</span>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}
    </div>
  );
}