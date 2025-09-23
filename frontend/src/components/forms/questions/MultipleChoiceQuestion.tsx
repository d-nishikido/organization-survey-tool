
import { Question } from '@/types/survey';

interface MultipleChoiceQuestionProps {
  question: Question;
  value?: string;
  onChange: (value: string) => void;
  error?: string;
}

export function MultipleChoiceQuestion({
  question,
  value,
  onChange,
  error
}: MultipleChoiceQuestionProps): JSX.Element {
  const handleChange = (selectedValue: string) => {
    onChange(selectedValue);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {question.options?.map((option, index) => (
          <label
            key={index}
            className={`
              flex items-center p-4 border rounded-lg cursor-pointer transition-colors
              ${value === option 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
              ${error ? 'border-red-300' : ''}
            `}
          >
            <input
              type="radio"
              name={`question-${question.id}`}
              value={option}
              checked={value === option}
              onChange={(e) => handleChange(e.target.value)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <span className="ml-3 text-gray-900">{option}</span>
          </label>
        ))}
      </div>
      
      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}
    </div>
  );
}