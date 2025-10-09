import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryDeleteDialog } from '../CategoryDeleteDialog';
import type { CategoryWithQuestionCount } from '@/types/category';

const mockOnClose = vi.fn();
const mockOnConfirm = vi.fn();

const mockCategory: CategoryWithQuestionCount = {
  id: 1,
  code: 'A',
  name: '仕事について',
  description: '業務内容・負荷・やりがい',
  display_order: 1,
  is_active: true,
  question_count: 5,
  created_at: '2025-10-01T00:00:00Z',
  updated_at: '2025-10-01T00:00:00Z',
};

const mockCategoryNoQuestions: CategoryWithQuestionCount = {
  ...mockCategory,
  question_count: 0,
};

describe('CategoryDeleteDialog', () => {
  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnConfirm.mockClear();
  });

  describe('ダイアログの基本表示', () => {
    it('isOpen=falseの場合、ダイアログが表示されない', () => {
      render(
        <CategoryDeleteDialog
          isOpen={false}
          category={mockCategory}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('isOpen=trueの場合、ダイアログが表示される', () => {
      render(
        <CategoryDeleteDialog
          isOpen={true}
          category={mockCategory}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('削除確認のタイトルが表示される', () => {
      render(
        <CategoryDeleteDialog
          isOpen={true}
          category={mockCategory}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText('カテゴリの削除')).toBeInTheDocument();
    });

    it('キャンセルボタンが表示される', () => {
      render(
        <CategoryDeleteDialog
          isOpen={true}
          category={mockCategory}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByRole('button', { name: /キャンセル/ })).toBeInTheDocument();
    });

    it('削除ボタンが表示される', () => {
      render(
        <CategoryDeleteDialog
          isOpen={true}
          category={mockCategory}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByRole('button', { name: /削除/ })).toBeInTheDocument();
    });
  });

  describe('削除対象カテゴリ情報の表示', () => {
    it('削除対象のカテゴリ名を表示する', () => {
      render(
        <CategoryDeleteDialog
          isOpen={true}
          category={mockCategory}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText(/仕事について/)).toBeInTheDocument();
    });

    it('削除対象のカテゴリコードを表示する', () => {
      render(
        <CategoryDeleteDialog
          isOpen={true}
          category={mockCategory}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText(/A/)).toBeInTheDocument();
    });

    it('カテゴリの説明を表示する', () => {
      render(
        <CategoryDeleteDialog
          isOpen={true}
          category={mockCategory}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText(/業務内容・負荷・やりがい/)).toBeInTheDocument();
    });
  });

  describe('関連質問がある場合の警告表示', () => {
    it('関連質問がある場合、警告メッセージを表示する', () => {
      render(
        <CategoryDeleteDialog
          isOpen={true}
          category={mockCategory}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      expect(
        screen.getByText(/このカテゴリには5件の質問が関連しています/)
      ).toBeInTheDocument();
    });

    it('関連質問がある場合、影響範囲の説明を表示する', () => {
      render(
        <CategoryDeleteDialog
          isOpen={true}
          category={mockCategory}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      expect(
        screen.getByText(/削除すると質問のカテゴリ参照がNULLになります/)
      ).toBeInTheDocument();
    });

    it('関連質問がある場合、警告アイコンを表示する', () => {
      render(
        <CategoryDeleteDialog
          isOpen={true}
          category={mockCategory}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      const warningIcon = screen.getByRole('img', { name: /警告/ });
      expect(warningIcon).toBeInTheDocument();
    });

    it('関連質問がない場合、警告メッセージを表示しない', () => {
      render(
        <CategoryDeleteDialog
          isOpen={true}
          category={mockCategoryNoQuestions}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      expect(
        screen.queryByText(/このカテゴリには.*件の質問が関連しています/)
      ).not.toBeInTheDocument();
    });

    it('関連質問がない場合、通常の確認メッセージを表示する', () => {
      render(
        <CategoryDeleteDialog
          isOpen={true}
          category={mockCategoryNoQuestions}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      expect(
        screen.getByText(/このカテゴリを削除してもよろしいですか/)
      ).toBeInTheDocument();
    });
  });

  describe('削除確認の動作', () => {
    it('削除ボタンクリック時にonConfirmが呼ばれる', async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockResolvedValueOnce(undefined);

      render(
        <CategoryDeleteDialog
          isOpen={true}
          category={mockCategory}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /削除/ });
      await user.click(deleteButton);

      expect(mockOnConfirm).toHaveBeenCalledWith(mockCategory.id);
    });

    it('削除成功後にダイアログが閉じる', async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockResolvedValueOnce(undefined);

      render(
        <CategoryDeleteDialog
          isOpen={true}
          category={mockCategory}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /削除/ });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('削除中は削除ボタンが無効化される', async () => {
      const user = userEvent.setup();
      let resolveDelete: () => void;
      const deletePromise = new Promise<void>((resolve) => {
        resolveDelete = resolve;
      });
      mockOnConfirm.mockReturnValueOnce(deletePromise);

      render(
        <CategoryDeleteDialog
          isOpen={true}
          category={mockCategory}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /削除/ });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(deleteButton).toBeDisabled();
      });

      resolveDelete!();
    });

    it('削除失敗時にはダイアログが閉じない', async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockRejectedValueOnce(new Error('Failed to delete'));

      render(
        <CategoryDeleteDialog
          isOpen={true}
          category={mockCategory}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      const deleteButton = screen.getByRole('button', { name: /削除/ });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalled();
      });

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('キャンセル動作', () => {
    it('キャンセルボタンクリック時にonCloseが呼ばれる', async () => {
      const user = userEvent.setup();

      render(
        <CategoryDeleteDialog
          isOpen={true}
          category={mockCategory}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /キャンセル/ });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('閉じるボタンクリック時にonCloseが呼ばれる', async () => {
      const user = userEvent.setup();

      render(
        <CategoryDeleteDialog
          isOpen={true}
          category={mockCategory}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('categoryがnullの場合', () => {
    it('ダイアログが表示されない', () => {
      render(
        <CategoryDeleteDialog
          isOpen={true}
          category={null}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
