import React from 'react';
import { Question } from '@/types/survey';

interface YesNoQuestionProps {
  question: Question;
  value?: string;
  onChange: (value: string) => void;
  error?: string;
}

export function YesNoQuestion({
  question: _question,
  value,
  onChange,
  error
}: YesNoQuestionProps): JSX.Element {
  const options = [
    { value: 'yes', label: 'はい' },
    { value: 'no', label: 'いいえ' }
  ];

  const handleChange = (selectedValue: string) => {
    onChange(selectedValue);
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-4">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleChange(option.value)}
            className={`
              flex-1 py-4 px-6 text-center rounded-lg border transition-colors font-medium
              ${value === option.value
                ? 'border-blue-500 bg-blue-500 text-white'
                : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
              }
              ${error ? 'border-red-300' : ''}
            `}
          >
            {option.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}
    </div>
  );
}