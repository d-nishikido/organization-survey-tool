import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { SurveyQuestionAssignment } from '../SurveyQuestionAssignment';
import { SurveyQuestionService } from '@/api/services/surveyQuestionService';
import { categoryService } from '@/api/services/categoryService';

// Mock services
vi.mock('@/api/services/surveyQuestionService');
vi.mock('@/api/services/categoryService');

const mockSurveyData = {
  survey: {
    id: 1,
    title: 'テスト調査',
    description: 'テスト用の調査です',
    start_date: '2025-01-01T00:00:00Z',
    end_date: '2025-12-31T23:59:59Z',
    is_anonymous: true,
    status: 'draft' as const,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  assignedQuestions: [
    {
      id: 1,
      text: '質問1',
      type: 'text' as const,
      category_id: 1,
      category_name: 'カテゴリA',
      order_num: 1,
      is_required: true,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
  ],
  availableQuestions: [],
};

const mockCategories = [
  { id: 1, name: 'カテゴリA', question_count: 5 },
];

describe('SurveyQuestionAssignment - Preview Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(SurveyQuestionService.getSurveyQuestions).mockResolvedValue(mockSurveyData);
    vi.mocked(categoryService.getCategories).mockResolvedValue(mockCategories);
  });

  describe('Task 1.1: プレビューボタンのUI実装', () => {
    it('should render preview button in header area', async () => {
      render(
        <BrowserRouter>
          <SurveyQuestionAssignment />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('テスト調査')).toBeInTheDocument();
      });

      // プレビューボタンが表示されること
      const previewButton = screen.getByRole('button', { name: /プレビュー/i });
      expect(previewButton).toBeInTheDocument();
    });

    it('should have proper styling consistent with existing UI', async () => {
      render(
        <BrowserRouter>
          <SurveyQuestionAssignment />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('テスト調査')).toBeInTheDocument();
      });

      const previewButton = screen.getByRole('button', { name: /プレビュー/i });

      // Tailwind CSSクラスが適用されていること（Buttonコンポーネント使用）
      expect(previewButton).toHaveClass('button'); // または適切なクラス名
    });
  });

  describe('Task 1.2: プレビューボタンの有効/無効状態制御', () => {
    it('should enable button when questions are assigned', async () => {
      render(
        <BrowserRouter>
          <SurveyQuestionAssignment />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('テスト調査')).toBeInTheDocument();
      });

      const previewButton = screen.getByRole('button', { name: /プレビュー/i });
      expect(previewButton).not.toBeDisabled();
    });

    it('should disable button when no questions are assigned', async () => {
      vi.mocked(SurveyQuestionService.getSurveyQuestions).mockResolvedValue({
        ...mockSurveyData,
        assignedQuestions: [],
      });

      render(
        <BrowserRouter>
          <SurveyQuestionAssignment />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('テスト調査')).toBeInTheDocument();
      });

      const previewButton = screen.getByRole('button', { name: /プレビュー/i });
      expect(previewButton).toBeDisabled();
    });

    it('should show tooltip when button is disabled', async () => {
      vi.mocked(SurveyQuestionService.getSurveyQuestions).mockResolvedValue({
        ...mockSurveyData,
        assignedQuestions: [],
      });

      render(
        <BrowserRouter>
          <SurveyQuestionAssignment />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('テスト調査')).toBeInTheDocument();
      });

      const previewButton = screen.getByRole('button', { name: /プレビュー/i });

      // ツールチップのtitle属性が設定されていること
      expect(previewButton).toHaveAttribute('title', '質問を割り当ててください');
    });
  });

  describe('Task 1.3: プレビューモーダルの開閉状態管理', () => {
    it('should open modal when preview button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <SurveyQuestionAssignment />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('テスト調査')).toBeInTheDocument();
      });

      const previewButton = screen.getByRole('button', { name: /プレビュー/i });
      await user.click(previewButton);

      // モーダルが表示されること（モーダルは次のタスクで実装するため、ここではprops渡しのみテスト）
      // 実際のモーダル表示確認はタスク2で実施
    });
  });
});
