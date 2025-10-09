import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryDetailPanel } from '../CategoryDetailPanel';
import type { CategoryWithQuestionCount } from '@/types/category';

const mockOnClose = vi.fn();

const mockCategory: CategoryWithQuestionCount = {
  id: 1,
  code: 'A',
  name: '仕事について',
  description: '業務内容・負荷・やりがい',
  display_order: 1,
  is_active: true,
  question_count: 5,
  created_at: '2025-10-01T10:30:00Z',
  updated_at: '2025-10-05T14:20:00Z',
};

const mockCategoryNoQuestions: CategoryWithQuestionCount = {
  ...mockCategory,
  question_count: 0,
};

describe('CategoryDetailPanel', () => {
  beforeEach(() => {
    mockOnClose.mockClear();
  });

  describe('パネルの基本表示', () => {
    it('isOpen=falseの場合、パネルが表示されない', () => {
      render(
        <CategoryDetailPanel
          isOpen={false}
          category={mockCategory}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('isOpen=trueの場合、パネルが表示される', () => {
      render(
        <CategoryDetailPanel
          isOpen={true}
          category={mockCategory}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('カテゴリ詳細のタイトルが表示される', () => {
      render(
        <CategoryDetailPanel
          isOpen={true}
          category={mockCategory}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('カテゴリ詳細')).toBeInTheDocument();
    });

    it('閉じるボタンが表示される', () => {
      render(
        <CategoryDetailPanel
          isOpen={true}
          category={mockCategory}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
    });
  });

  describe('カテゴリ基本情報の表示', () => {
    it('カテゴリコードを表示する', () => {
      render(
        <CategoryDetailPanel
          isOpen={true}
          category={mockCategory}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('カテゴリ名を表示する', () => {
      render(
        <CategoryDetailPanel
          isOpen={true}
          category={mockCategory}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('仕事について')).toBeInTheDocument();
    });

    it('説明を表示する', () => {
      render(
        <CategoryDetailPanel
          isOpen={true}
          category={mockCategory}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('業務内容・負荷・やりがい')).toBeInTheDocument();
    });

    it('表示順序を表示する', () => {
      render(
        <CategoryDetailPanel
          isOpen={true}
          category={mockCategory}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/表示順序/)).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('ステータス（有効）を表示する', () => {
      render(
        <CategoryDetailPanel
          isOpen={true}
          category={mockCategory}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('有効')).toBeInTheDocument();
    });

    it('ステータス（無効）を表示する', () => {
      const inactiveCategory = { ...mockCategory, is_active: false };
      render(
        <CategoryDetailPanel
          isOpen={true}
          category={inactiveCategory}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('無効')).toBeInTheDocument();
    });
  });

  describe('関連質問数の表示', () => {
    it('関連質問数を表示する', () => {
      render(
        <CategoryDetailPanel
          isOpen={true}
          category={mockCategory}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/関連質問数/)).toBeInTheDocument();
      expect(screen.getByText('5件')).toBeInTheDocument();
    });

    it('関連質問がない場合は0件と表示する', () => {
      render(
        <CategoryDetailPanel
          isOpen={true}
          category={mockCategoryNoQuestions}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('0件')).toBeInTheDocument();
    });

    it('関連質問がない場合にメッセージを表示する', () => {
      render(
        <CategoryDetailPanel
          isOpen={true}
          category={mockCategoryNoQuestions}
          onClose={mockOnClose}
        />
      );

      expect(
        screen.getByText('このカテゴリには関連する質問がありません')
      ).toBeInTheDocument();
    });
  });

  describe('日時情報の表示', () => {
    it('作成日時を表示する', () => {
      render(
        <CategoryDetailPanel
          isOpen={true}
          category={mockCategory}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/作成日時/)).toBeInTheDocument();
      expect(screen.getByText(/2025-10-01/)).toBeInTheDocument();
    });

    it('最終更新日時を表示する', () => {
      render(
        <CategoryDetailPanel
          isOpen={true}
          category={mockCategory}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(/最終更新日時/)).toBeInTheDocument();
      expect(screen.getByText(/2025-10-05/)).toBeInTheDocument();
    });
  });

  describe('パネルの閉じる動作', () => {
    it('閉じるボタンクリック時にonCloseが呼ばれる', async () => {
      const user = userEvent.setup();
      render(
        <CategoryDetailPanel
          isOpen={true}
          category={mockCategory}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('categoryがnullの場合', () => {
    it('パネルが表示されない', () => {
      render(
        <CategoryDetailPanel
          isOpen={true}
          category={null}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
