import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QuestionManagement } from '../QuestionManagement';
import { questionService } from '@/api/services/questionService';
import type { QuestionResponse } from '@/types/question';

// Mock the question service
vi.mock('@/api/services/questionService', () => ({
  questionService: {
    getQuestions: vi.fn(),
    createQuestion: vi.fn(),
    updateQuestion: vi.fn(),
    deleteQuestion: vi.fn(),
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
  {
    id: 2,
    question: 'レガシー評価質問',
    type: 'rating_10',
    category: 'B',
    is_required: false,
    options: null,
    min_value: null,
    max_value: null,
    min_label: null,
    max_label: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
];

describe('QuestionManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(questionService.getQuestions).mockResolvedValue({
      data: mockQuestions,
      total: 2,
      page: 1,
      pageSize: 10,
    });
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <QuestionManagement />
      </BrowserRouter>
    );
  };

  describe('質問タイププルダウンに不要なタイプが表示されない', () => {
    it('新規作成モーダルのプルダウンにrating、rating_5、rating_10が表示されないこと', async () => {
      renderComponent();

      // Wait for questions to load
      await waitFor(() => {
        expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument();
      });

      // Open create modal
      const createButton = screen.getByRole('button', { name: /新規質問作成/i });
      await userEvent.click(createButton);

      // Get the type select element
      const typeSelect = screen.getByLabelText(/質問タイプ/i);
      const options = within(typeSelect).getAllByRole('option');
      const optionTexts = options.map(opt => opt.textContent);

      // Should NOT include legacy types
      expect(optionTexts).not.toContain('評価');
      expect(optionTexts).not.toContain('評価（5段階）');
      expect(optionTexts).not.toContain('評価（10段階）');
      expect(optionTexts).not.toContain('評価（レガシー）');
      expect(optionTexts).not.toContain('評価（5段階・レガシー）');
      expect(optionTexts).not.toContain('評価（10段階・レガシー）');

      // Should include active types
      expect(optionTexts).toContain('テキスト(短文)');
      expect(optionTexts).toContain('単一選択');
      expect(optionTexts).toContain('スケール');
      expect(optionTexts).toContain('はい/いいえ');
    });

    it('はい/いいえタイプが1つのみ表示されること', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /新規質問作成/i });
      await userEvent.click(createButton);

      const typeSelect = screen.getByLabelText(/質問タイプ/i);
      const options = within(typeSelect).getAllByRole('option');
      const yesNoOptions = options.filter(opt =>
        opt.textContent === 'はい/いいえ'
      );

      expect(yesNoOptions).toHaveLength(1);
    });
  });

  describe('スケールタイプ選択時にデフォルト値が設定される', () => {
    it('スケールを選択すると最小値1、最大値5が自動設定されること', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument();
      });

      const createButton = screen.getByRole('button', { name: /新規質問作成/i });
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

      const createButton = screen.getByRole('button', { name: /新規質問作成/i });
      await userEvent.click(createButton);

      // First select scale to show the fields
      const typeSelect = screen.getByLabelText(/質問タイプ/i);
      await userEvent.selectOptions(typeSelect, 'scale');

      // Change the values
      const minValueInput = screen.getByLabelText(/最小値/i) as HTMLInputElement;
      const maxValueInput = screen.getByLabelText(/最大値/i) as HTMLInputElement;

      await userEvent.clear(minValueInput);
      await userEvent.type(minValueInput, '0');
      await userEvent.clear(maxValueInput);
      await userEvent.type(maxValueInput, '10');

      // Switch to another type and back to scale
      await userEvent.selectOptions(typeSelect, 'text');
      await userEvent.selectOptions(typeSelect, 'scale');

      // Values should be preserved (not reset to defaults)
      expect(minValueInput.value).toBe('0');
      expect(maxValueInput.value).toBe('10');
    });
  });

  describe('既存質問の表示時に正しいラベルが表示される', () => {
    it('通常の質問タイプが正しいラベルで表示されること', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('テスト質問1')).toBeInTheDocument();
      });

      // Check that the type is displayed with correct label
      const typeCell = screen.getByText('テキスト(短文)');
      expect(typeCell).toBeInTheDocument();
    });

    it('レガシータイプの質問が適切なラベルで表示されること', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('レガシー評価質問')).toBeInTheDocument();
      });

      // Check that legacy type is displayed with legacy label
      const legacyTypeCell = screen.getByText('評価（10段階・レガシー）');
      expect(legacyTypeCell).toBeInTheDocument();
    });

    it('スケールタイプが「スケール」と表示されること', async () => {
      const scaleQuestion: QuestionResponse = {
        id: 3,
        question: 'スケール質問',
        type: 'scale',
        category: 'A',
        is_required: false,
        options: null,
        min_value: 1,
        max_value: 5,
        min_label: '低い',
        max_label: '高い',
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

      const scaleTypeCell = screen.getByText('スケール');
      expect(scaleTypeCell).toBeInTheDocument();
    });
  });

  describe('質問作成機能', () => {
    it('スケール質問を作成できること', async () => {
      vi.mocked(questionService.createQuestion).mockResolvedValue({
        id: 4,
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

      const createButton = screen.getByRole('button', { name: /新規質問作成/i });
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
});
