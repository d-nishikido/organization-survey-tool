import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuestionBank } from '../QuestionBank';
import { questionService } from '@/api/services/questionService';
import type { QuestionResponse } from '@/types/question';

// Mock the question service
vi.mock('@/api/services/questionService', () => ({
  questionService: {
    getQuestions: vi.fn(),
    createQuestion: vi.fn(),
  },
}));

const mockQuestions: QuestionResponse[] = [
  {
    id: 1,
    question: 'テスト質問1',
    type: 'text',
    category: 'A',
    is_required: true,
    options: null,
    min_value: null,
    max_value: null,
    min_label: null,
    max_label: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
];

describe('QuestionBank', () => {
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(questionService.getQuestions).mockResolvedValue({
      data: mockQuestions,
      total: 1,
      page: 1,
      pageSize: 10,
    });
  });

  const renderComponent = () => {
    return render(<QuestionBank onSelect={mockOnSelect} selectedIds={[]} />);
  };

  describe('質問タイププルダウンにはい/いいえが1つのみ表示される', () => {
    it('新規作成モーダルのプルダウンにはい/いいえが1つだけ表示されること', async () => {
      renderComponent();

      // Wait for questions to load
      await waitFor(() => {
        expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument();
      });

      // Open create modal
      const createButton = screen.getByRole('button', { name: /新しい質問を作成/i });
      await userEvent.click(createButton);

      // Get the type select element
      const typeSelect = screen.getByLabelText(/質問タイプ/i);
      const options = within(typeSelect).getAllByRole('option');
      const yesNoOptions = options.filter(opt =>
        opt.textContent === 'はい/いいえ'
      );

      expect(yesNoOptions).toHaveLength(1);
    });

    it('プルダウンにrating、rating_5、rating_10が表示されないこと', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /新しい質問を作成/i });
      await userEvent.click(createButton);

      const typeSelect = screen.getByLabelText(/質問タイプ/i);
      const options = within(typeSelect).getAllByRole('option');
      const optionTexts = options.map(opt => opt.textContent);

      expect(optionTexts).not.toContain('評価');
      expect(optionTexts).not.toContain('評価（5段階）');
      expect(optionTexts).not.toContain('評価（10段階）');
      expect(optionTexts).not.toContain('評価（レガシー）');
      expect(optionTexts).not.toContain('評価（5段階・レガシー）');
      expect(optionTexts).not.toContain('評価（10段階・レガシー）');
    });
  });

  describe('スケールタイプ選択時にデフォルト値が設定される', () => {
    it('スケールを選択すると最小値1、最大値5が自動設定されること', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /新しい質問を作成/i });
      await userEvent.click(createButton);

      // Select scale type
      const typeSelect = screen.getByLabelText(/質問タイプ/i);
      await userEvent.selectOptions(typeSelect, 'scale');

      // Check that min and max value fields appear with default values
      await waitFor(() => {
        const minValueInput = screen.getByLabelText(/最小値/i) as HTMLInputElement;
        const maxValueInput = screen.getByLabelText(/最大値/i) as HTMLInputElement;

        expect(minValueInput.value).toBe('1');
        expect(maxValueInput.value).toBe('5');
      });
    });

    it('既存の値がある場合はデフォルト値で上書きしないこと', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /新しい質問を作成/i });
      await userEvent.click(createButton);

      const typeSelect = screen.getByLabelText(/質問タイプ/i);
      await userEvent.selectOptions(typeSelect, 'scale');

      // Change the values
      const minValueInput = screen.getByLabelText(/最小値/i) as HTMLInputElement;
      const maxValueInput = screen.getByLabelText(/最大値/i) as HTMLInputElement;

      await userEvent.clear(minValueInput);
      await userEvent.type(minValueInput, '2');
      await userEvent.clear(maxValueInput);
      await userEvent.type(maxValueInput, '7');

      // Switch to another type and back to scale
      await userEvent.selectOptions(typeSelect, 'text');
      await userEvent.selectOptions(typeSelect, 'scale');

      // Values should be preserved
      expect(minValueInput.value).toBe('2');
      expect(maxValueInput.value).toBe('7');
    });
  });

  describe('質問作成機能', () => {
    it('スケール質問を作成できること', async () => {
      vi.mocked(questionService.createQuestion).mockResolvedValue({
        id: 2,
        question: '新しいスケール質問',
        type: 'scale',
        category: 'A',
        is_required: true,
        options: null,
        min_value: 1,
        max_value: 5,
        min_label: null,
        max_label: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /新しい質問を作成/i });
      await userEvent.click(createButton);

      // Fill in the form
      const questionInput = screen.getByLabelText(/質問文/i);
      await userEvent.type(questionInput, '新しいスケール質問');

      const typeSelect = screen.getByLabelText(/質問タイプ/i);
      await userEvent.selectOptions(typeSelect, 'scale');

      // Submit the form
      const saveButton = screen.getByRole('button', { name: /保存/i });
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(questionService.createQuestion).toHaveBeenCalledWith(
          expect.objectContaining({
            question: '新しいスケール質問',
            type: 'scale',
            min_value: 1,
            max_value: 5,
          })
        );
      });
    });
  });

  describe('既存質問の表示', () => {
    it('質問タイプが正しいラベルで表示されること', async () => {
      const scaleQuestion: QuestionResponse = {
        id: 2,
        question: 'スケール質問',
        type: 'scale',
        category: 'A',
        is_required: false,
        options: null,
        min_value: 1,
        max_value: 5,
        min_label: null,
        max_label: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      vi.mocked(questionService.getQuestions).mockResolvedValue({
        data: [scaleQuestion],
        total: 1,
        page: 1,
        pageSize: 10,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('スケール質問')).toBeInTheDocument();
      });

      const scaleLabel = screen.getByText('スケール');
      expect(scaleLabel).toBeInTheDocument();
    });
  });
});
