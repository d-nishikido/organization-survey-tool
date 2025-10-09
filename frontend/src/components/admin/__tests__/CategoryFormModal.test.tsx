import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryFormModal } from '../CategoryFormModal';
import type { CategoryWithQuestionCount } from '@/types/category';

const mockOnClose = vi.fn();
const mockOnSubmit = vi.fn();

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

describe('CategoryFormModal', () => {
  beforeEach(() => {
    mockOnClose.mockClear();
    mockOnSubmit.mockClear();
  });

  describe('モーダルの基本表示', () => {
    it('isOpen=falseの場合、モーダルが表示されない', () => {
      render(
        <CategoryFormModal
          isOpen={false}
          category={null}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('isOpen=trueの場合、モーダルが表示される', () => {
      render(
        <CategoryFormModal
          isOpen={true}
          category={null}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('category=nullの場合、新規作成モードのタイトルを表示する', () => {
      render(
        <CategoryFormModal
          isOpen={true}
          category={null}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('カテゴリ新規作成')).toBeInTheDocument();
    });

    it('categoryが指定されている場合、編集モードのタイトルを表示する', () => {
      render(
        <CategoryFormModal
          isOpen={true}
          category={mockCategory}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('カテゴリ編集')).toBeInTheDocument();
    });

    it('閉じるボタンが表示される', () => {
      render(
        <CategoryFormModal
          isOpen={true}
          category={null}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('フォームフィールドの表示', () => {
    it('全ての入力フィールドが表示される', () => {
      render(
        <CategoryFormModal
          isOpen={true}
          category={null}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByLabelText(/カテゴリコード/)).toBeInTheDocument();
      expect(screen.getByLabelText(/カテゴリ名/)).toBeInTheDocument();
      expect(screen.getByLabelText(/説明/)).toBeInTheDocument();
      expect(screen.getByLabelText(/表示順序/)).toBeInTheDocument();
      expect(screen.getByLabelText(/有効/)).toBeInTheDocument();
    });

    it('新規作成モードでは全フィールドが空白である', () => {
      render(
        <CategoryFormModal
          isOpen={true}
          category={null}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const codeInput = screen.getByLabelText(/カテゴリコード/) as HTMLInputElement;
      const nameInput = screen.getByLabelText(/カテゴリ名/) as HTMLInputElement;
      const descriptionInput = screen.getByLabelText(/説明/) as HTMLTextAreaElement;
      const displayOrderInput = screen.getByLabelText(/表示順序/) as HTMLInputElement;
      const isActiveCheckbox = screen.getByLabelText(/有効/) as HTMLInputElement;

      expect(codeInput.value).toBe('');
      expect(nameInput.value).toBe('');
      expect(descriptionInput.value).toBe('');
      expect(displayOrderInput.value).toBe('1'); // デフォルト値
      expect(isActiveCheckbox.checked).toBe(true); // デフォルト値
    });

    it('編集モードでは既存の値が初期表示される', () => {
      render(
        <CategoryFormModal
          isOpen={true}
          category={mockCategory}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const codeInput = screen.getByLabelText(/カテゴリコード/) as HTMLInputElement;
      const nameInput = screen.getByLabelText(/カテゴリ名/) as HTMLInputElement;
      const descriptionInput = screen.getByLabelText(/説明/) as HTMLTextAreaElement;
      const displayOrderInput = screen.getByLabelText(/表示順序/) as HTMLInputElement;
      const isActiveCheckbox = screen.getByLabelText(/有効/) as HTMLInputElement;

      expect(codeInput.value).toBe('A');
      expect(nameInput.value).toBe('仕事について');
      expect(descriptionInput.value).toBe('業務内容・負荷・やりがい');
      expect(displayOrderInput.value).toBe('1');
      expect(isActiveCheckbox.checked).toBe(true);
    });

    it('編集モードではカテゴリコードフィールドが無効化される', () => {
      render(
        <CategoryFormModal
          isOpen={true}
          category={mockCategory}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const codeInput = screen.getByLabelText(/カテゴリコード/) as HTMLInputElement;
      expect(codeInput).toBeDisabled();
    });
  });

  describe('バリデーション', () => {
    it('カテゴリコードが空の場合、エラーメッセージを表示する', async () => {
      const user = userEvent.setup();
      render(
        <CategoryFormModal
          isOpen={true}
          category={null}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const submitButton = screen.getByRole('button', { name: /作成/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('カテゴリコードは必須です')).toBeInTheDocument();
      });
    });

    it('カテゴリコードが4文字以上の場合、エラーメッセージを表示する', async () => {
      const user = userEvent.setup();
      render(
        <CategoryFormModal
          isOpen={true}
          category={null}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const codeInput = screen.getByLabelText(/カテゴリコード/);
      await user.type(codeInput, 'ABCD');

      const submitButton = screen.getByRole('button', { name: /作成/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('カテゴリコードは3文字以内で入力してください')).toBeInTheDocument();
      });
    });

    it('カテゴリコードに特殊文字が含まれる場合、エラーメッセージを表示する', async () => {
      const user = userEvent.setup();
      render(
        <CategoryFormModal
          isOpen={true}
          category={null}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const codeInput = screen.getByLabelText(/カテゴリコード/);
      await user.type(codeInput, 'A@#');

      const submitButton = screen.getByRole('button', { name: /作成/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('英数字のみ使用可能です')).toBeInTheDocument();
      });
    });

    it('カテゴリ名が空の場合、エラーメッセージを表示する', async () => {
      const user = userEvent.setup();
      render(
        <CategoryFormModal
          isOpen={true}
          category={null}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const submitButton = screen.getByRole('button', { name: /作成/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('カテゴリ名は必須です')).toBeInTheDocument();
      });
    });

    it('カテゴリ名が51文字以上の場合、エラーメッセージを表示する', async () => {
      const user = userEvent.setup();
      render(
        <CategoryFormModal
          isOpen={true}
          category={null}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const nameInput = screen.getByLabelText(/カテゴリ名/);
      await user.type(nameInput, 'A'.repeat(51));

      const submitButton = screen.getByRole('button', { name: /作成/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('50文字以内で入力してください')).toBeInTheDocument();
      });
    });

    it('説明が201文字以上の場合、エラーメッセージを表示する', async () => {
      const user = userEvent.setup();
      render(
        <CategoryFormModal
          isOpen={true}
          category={null}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const descriptionInput = screen.getByLabelText(/説明/);
      await user.type(descriptionInput, 'A'.repeat(201));

      const submitButton = screen.getByRole('button', { name: /作成/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('200文字以内で入力してください')).toBeInTheDocument();
      });
    });

    it('表示順序が0以下の場合、エラーメッセージを表示する', async () => {
      const user = userEvent.setup();
      render(
        <CategoryFormModal
          isOpen={true}
          category={null}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const displayOrderInput = screen.getByLabelText(/表示順序/);
      await user.clear(displayOrderInput);
      await user.type(displayOrderInput, '0');

      const submitButton = screen.getByRole('button', { name: /作成/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('1以上の数値を入力してください')).toBeInTheDocument();
      });
    });

    it('表示順序が整数でない場合、エラーメッセージを表示する', async () => {
      const user = userEvent.setup();
      render(
        <CategoryFormModal
          isOpen={true}
          category={null}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const displayOrderInput = screen.getByLabelText(/表示順序/);
      await user.clear(displayOrderInput);
      await user.type(displayOrderInput, '1.5');

      const submitButton = screen.getByRole('button', { name: /作成/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('整数を入力してください')).toBeInTheDocument();
      });
    });
  });

  describe('フォーム送信', () => {
    it('正しい入力で作成ボタンをクリックするとonSubmitが呼ばれる', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValueOnce(undefined);

      render(
        <CategoryFormModal
          isOpen={true}
          category={null}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      await user.type(screen.getByLabelText(/カテゴリコード/), 'A');
      await user.type(screen.getByLabelText(/カテゴリ名/), '仕事について');
      await user.type(screen.getByLabelText(/説明/), '業務内容・負荷・やりがい');
      await user.clear(screen.getByLabelText(/表示順序/));
      await user.type(screen.getByLabelText(/表示順序/), '1');

      const submitButton = screen.getByRole('button', { name: /作成/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          code: 'A',
          name: '仕事について',
          description: '業務内容・負荷・やりがい',
          display_order: 1,
          is_active: true,
        });
      });
    });

    it('編集モードで更新ボタンをクリックするとonSubmitが呼ばれる', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValueOnce(undefined);

      render(
        <CategoryFormModal
          isOpen={true}
          category={mockCategory}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const nameInput = screen.getByLabelText(/カテゴリ名/);
      await user.clear(nameInput);
      await user.type(nameInput, '仕事について(更新)');

      const submitButton = screen.getByRole('button', { name: /更新/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: '仕事について(更新)',
          description: '業務内容・負荷・やりがい',
          display_order: 1,
          is_active: true,
        });
      });
    });

    it('送信成功後にモーダルが閉じる', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockResolvedValueOnce(undefined);

      render(
        <CategoryFormModal
          isOpen={true}
          category={null}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      await user.type(screen.getByLabelText(/カテゴリコード/), 'A');
      await user.type(screen.getByLabelText(/カテゴリ名/), '仕事について');

      const submitButton = screen.getByRole('button', { name: /作成/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('送信中は送信ボタンが無効化される', async () => {
      const user = userEvent.setup();
      let resolveSubmit: () => void;
      const submitPromise = new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      });
      mockOnSubmit.mockReturnValueOnce(submitPromise);

      render(
        <CategoryFormModal
          isOpen={true}
          category={null}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      await user.type(screen.getByLabelText(/カテゴリコード/), 'A');
      await user.type(screen.getByLabelText(/カテゴリ名/), '仕事について');

      const submitButton = screen.getByRole('button', { name: /作成/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      resolveSubmit!();
    });

    it('送信失敗時にはモーダルが閉じない', async () => {
      const user = userEvent.setup();
      mockOnSubmit.mockRejectedValueOnce(new Error('Failed to create'));

      render(
        <CategoryFormModal
          isOpen={true}
          category={null}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      await user.type(screen.getByLabelText(/カテゴリコード/), 'A');
      await user.type(screen.getByLabelText(/カテゴリ名/), '仕事について');

      const submitButton = screen.getByRole('button', { name: /作成/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('モーダルの閉じる動作', () => {
    it('閉じるボタンをクリックするとonCloseが呼ばれる', async () => {
      const user = userEvent.setup();
      render(
        <CategoryFormModal
          isOpen={true}
          category={null}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('キャンセルボタンをクリックするとonCloseが呼ばれる', async () => {
      const user = userEvent.setup();
      render(
        <CategoryFormModal
          isOpen={true}
          category={null}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /キャンセル/ });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
