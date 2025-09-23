import React from 'react';
import { Question } from '@/types/survey';

interface TextQuestionProps {
  question: Question;
  value?: string;
  onChange: (value: string) => void;
  error?: string;
}

export function TextQuestion({
  question,
  value,
  onChange,
  error
}: TextQuestionProps): JSX.Element {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="space-y-4">
      <textarea
        value={value || ''}
        onChange={handleChange}
        rows={4}
        placeholder="ご意見をお聞かせください..."
        className={`
          w-full px-4 py-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          ${error 
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
            : 'border-gray-300'
          }
        `}
        maxLength={1000}
      />
      
      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>{value?.length || 0} / 1000 文字</span>
        {question.required && (
          <span className="text-red-500">* 必須</span>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}
    </div>
  );
}