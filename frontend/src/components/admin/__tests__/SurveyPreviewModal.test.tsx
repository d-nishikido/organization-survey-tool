import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { SurveyPreviewModal } from '../SurveyPreviewModal';

const mockSurvey = {
  id: 1,
  title: 'テスト調査',
  description: 'テスト用の調査説明',
  start_date: '2025-01-01T00:00:00Z',
  end_date: '2025-12-31T23:59:59Z',
  is_anonymous: true,
};

const mockQuestions = [
  {
    id: 1,
    text: '質問1',
    type: 'text' as const,
    category_id: 1,
    category_name: 'カテゴリA',
    order_num: 1,
    is_required: true,
  },
  {
    id: 2,
    text: '質問2',
    type: 'yes_no' as const,
    category_id: 1,
    category_name: 'カテゴリA',
    order_num: 2,
    is_required: false,
  },
];

describe('SurveyPreviewModal', () => {
  describe('Task 2.1: 基本構造実装', () => {
    it('should render modal when isOpen is true', () => {
      const onClose = vi.fn();

      render(
        <SurveyPreviewModal
          isOpen={true}
          onClose={onClose}
          survey={mockSurvey}
          assignedQuestions={mockQuestions}
        />
      );

      // モーダルが表示されていること
      expect(screen.getByText('テスト調査')).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      const onClose = vi.fn();

      render(
        <SurveyPreviewModal
          isOpen={false}
          onClose={onClose}
          survey={mockSurvey}
          assignedQuestions={mockQuestions}
        />
      );

      // モーダルが表示されていないこと
      expect(screen.queryByText('テスト調査')).not.toBeInTheDocument();
    });
  });

  describe('Task 2.2: 調査メタデータ表示', () => {
    it('should display survey title prominently', () => {
      const onClose = vi.fn();

      render(
        <SurveyPreviewModal
          isOpen={true}
          onClose={onClose}
          survey={mockSurvey}
          assignedQuestions={mockQuestions}
        />
      );

      const title = screen.getByText('テスト調査');
      expect(title).toBeInTheDocument();
      // タイトルが大きく中央揃えで表示されること
      expect(title).toHaveClass('text-3xl');
    });

    it('should display survey description when provided', () => {
      const onClose = vi.fn();

      render(
        <SurveyPreviewModal
          isOpen={true}
          onClose={onClose}
          survey={mockSurvey}
          assignedQuestions={mockQuestions}
        />
      );

      expect(screen.getByText('テスト用の調査説明')).toBeInTheDocument();
    });

    it('should display survey period in Japanese format', () => {
      const onClose = vi.fn();

      render(
        <SurveyPreviewModal
          isOpen={true}
          onClose={onClose}
          survey={mockSurvey}
          assignedQuestions={mockQuestions}
        />
      );

      // 実施期間が表示されていること
      expect(screen.getByText(/実施期間/)).toBeInTheDocument();
    });

    it('should display anonymity guarantee when is_anonymous is true', () => {
      const onClose = vi.fn();

      render(
        <SurveyPreviewModal
          isOpen={true}
          onClose={onClose}
          survey={mockSurvey}
          assignedQuestions={mockQuestions}
        />
      );

      expect(screen.getByText(/匿名回答を保証/)).toBeInTheDocument();
    });

    it('should not display anonymity message when is_anonymous is false', () => {
      const onClose = vi.fn();

      render(
        <SurveyPreviewModal
          isOpen={true}
          onClose={onClose}
          survey={{ ...mockSurvey, is_anonymous: false }}
          assignedQuestions={mockQuestions}
        />
      );

      expect(screen.queryByText(/匿名回答を保証/)).not.toBeInTheDocument();
    });
  });

  describe('Task 2.3: モーダルの閉じる機能', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(
        <SurveyPreviewModal
          isOpen={true}
          onClose={onClose}
          survey={mockSurvey}
          assignedQuestions={mockQuestions}
        />
      );

      // 閉じるボタンをクリック
      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
