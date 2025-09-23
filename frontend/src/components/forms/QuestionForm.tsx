
import { Question } from '@/types/survey';
import { MultipleChoiceQuestion } from './questions/MultipleChoiceQuestion';
import { ScaleQuestion } from './questions/ScaleQuestion';
import { TextQuestion } from './questions/TextQuestion';
import { YesNoQuestion } from './questions/YesNoQuestion';

interface QuestionFormProps {
  question: Question;
  value?: string | number;
  onChange: (value: string | number) => void;
  error?: string;
}

export function QuestionForm({
  question,
  value,
  onChange,
  error
}: QuestionFormProps): JSX.Element {
  const validateRequired = (val?: string | number): string | undefined => {
    if (question.required && (!val || val === '')) {
      return 'この質問への回答は必須です。';
    }
    return undefined;
  };

  const currentError = error || validateRequired(value);

  const renderQuestionInput = () => {
    switch (question.type) {
      case 'multiple_choice':
        return (
          <MultipleChoiceQuestion
            question={question}
            value={value as string}
            onChange={onChange as (value: string) => void}
            error={currentError}
          />
        );
      case 'scale':
        return (
          <ScaleQuestion
            question={question}
            value={value as number}
            onChange={onChange as (value: number) => void}
            error={currentError}
          />
        );
      case 'text':
        return (
          <TextQuestion
            question={question}
            value={value as string}
            onChange={onChange as (value: string) => void}
            error={currentError}
          />
        );
      case 'yes_no':
        return (
          <YesNoQuestion
            question={question}
            value={value as string}
            onChange={onChange as (value: string) => void}
            error={currentError}
          />
        );
      default:
        return (
          <div className="text-red-500">
            サポートされていない質問タイプです: {question.type}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Question Header */}
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-semibold text-gray-900 leading-relaxed">
            {question.question}
          </h2>
          {question.required && (
            <span className="text-red-500 text-sm font-medium ml-2">必須</span>
          )}
        </div>
        
        {question.category && (
          <div className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
            {question.category}
          </div>
        )}
      </div>

      {/* Question Input */}
      <div className="bg-gray-50 p-6 rounded-lg">
        {renderQuestionInput()}
      </div>
    </div>
  );
}