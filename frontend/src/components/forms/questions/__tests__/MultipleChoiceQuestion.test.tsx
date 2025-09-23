import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MultipleChoiceQuestion } from '../MultipleChoiceQuestion';
import { Question } from '@/types/survey';

const mockQuestion: Question = {
  id: 'q1',
  type: 'multiple_choice',
  question: 'どのような働き方を好みますか？',
  options: ['リモートワーク', 'ハイブリッド', 'オフィス勤務'],
  required: true,
  category: 'work-style'
};

describe('MultipleChoiceQuestion', () => {
  it('renders question options correctly', () => {
    const onChange = vi.fn();
    render(
      <MultipleChoiceQuestion
        question={mockQuestion}
        onChange={onChange}
      />
    );

    expect(screen.getByText('リモートワーク')).toBeInTheDocument();
    expect(screen.getByText('ハイブリッド')).toBeInTheDocument();
    expect(screen.getByText('オフィス勤務')).toBeInTheDocument();
  });

  it('calls onChange when option is selected', () => {
    const onChange = vi.fn();
    render(
      <MultipleChoiceQuestion
        question={mockQuestion}
        onChange={onChange}
      />
    );

    const option = screen.getByLabelText('リモートワーク');
    fireEvent.click(option);

    expect(onChange).toHaveBeenCalledWith('リモートワーク');
  });

  it('highlights selected option', () => {
    const onChange = vi.fn();
    render(
      <MultipleChoiceQuestion
        question={mockQuestion}
        value="ハイブリッド"
        onChange={onChange}
      />
    );

    const selectedOption = screen.getByLabelText('ハイブリッド');
    expect(selectedOption).toBeChecked();
  });

  it('displays error message when provided', () => {
    const onChange = vi.fn();
    render(
      <MultipleChoiceQuestion
        question={mockQuestion}
        error="この質問への回答は必須です。"
        onChange={onChange}
      />
    );

    expect(screen.getByText('この質問への回答は必須です。')).toBeInTheDocument();
  });
});