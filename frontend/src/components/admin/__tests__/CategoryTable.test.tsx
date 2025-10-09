import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryTable } from '../CategoryTable';
import type { CategoryWithQuestionCount } from '@/types/category';

const mockCategories: CategoryWithQuestionCount[] = [
  {
    id: 1,
    code: 'A',
    name: '仕事について',
    description: '業務内容・負荷・やりがい',
    display_order: 1,
    is_active: true,
    question_count: 5,
    created_at: '2025-10-01T00:00:00Z',
    updated_at: '2025-10-01T00:00:00Z',
  },
  {
    id: 2,
    code: 'B',
    name: '最近の状態について',
    description: 'ストレス・モチベーション・健康',
    display_order: 2,
    is_active: true,
    question_count: 3,
    created_at: '2025-10-01T00:00:00Z',
    updated_at: '2025-10-01T00:00:00Z',
  },
  {
    id: 3,
    code: 'C',
    name: '周りの方々について',
    description: null,
    display_order: 3,
    is_active: false,
    question_count: 0,
    created_at: '2025-10-01T00:00:00Z',
    updated_at: '2025-10-01T00:00:00Z',
  },
];

describe('CategoryTable', () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnToggleStatus = vi.fn();
  const mockOnReorder = vi.fn();

  const defaultProps = {
    categories: mockCategories,
    onEdit: mockOnEdit,
    onDelete: mockOnDelete,
    onToggleStatus: mockOnToggleStatus,
    onReorder: mockOnReorder,
    isLoading: false,
  };

  describe('基本表示', () => {
    it('カテゴリ情報をテーブル形式で表示する', () => {
      render(<CategoryTable {...defaultProps} />);
      
      // テーブルヘッダー
      expect(screen.getByText('カテゴリコード')).toBeInTheDocument();
      expect(screen.getByText('カテゴリ名')).toBeInTheDocument();
      expect(screen.getByText('説明')).toBeInTheDocument();
      expect(screen.getByText('表示順序')).toBeInTheDocument();
      expect(screen.getByText('ステータス')).toBeInTheDocument();
      expect(screen.getByText('関連質問数')).toBeInTheDocument();
      expect(screen.getByText('アクション')).toBeInTheDocument();
    });

    it('カテゴリコードを表示する', () => {
      render(<CategoryTable {...defaultProps} />);
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('B')).toBeInTheDocument();
      expect(screen.getByText('C')).toBeInTheDocument();
    });

    it('カテゴリ名を表示する', () => {
      render(<CategoryTable {...defaultProps} />);
      expect(screen.getByText('仕事について')).toBeInTheDocument();
      expect(screen.getByText('最近の状態について')).toBeInTheDocument();
      expect(screen.getByText('周りの方々について')).toBeInTheDocument();
    });

    it('説明を表示する', () => {
      render(<CategoryTable {...defaultProps} />);
      expect(screen.getByText('業務内容・負荷・やりがい')).toBeInTheDocument();
      expect(screen.getByText('ストレス・モチベーション・健康')).toBeInTheDocument();
    });

    it('表示順序を表示する', () => {
      render(<CategoryTable {...defaultProps} />);
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('関連質問数をバッジ表示する', () => {
      render(<CategoryTable {...defaultProps} />);
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('ステータス表示', () => {
    it('有効なカテゴリに「有効」ラベルを表示する', () => {
      render(<CategoryTable {...defaultProps} />);
      const activeLabels = screen.getAllByText('有効');
      expect(activeLabels.length).toBe(2); // A, B カテゴリ
    });

    it('無効なカテゴリに「無効」ラベルを表示する', () => {
      render(<CategoryTable {...defaultProps} />);
      expect(screen.getByText('無効')).toBeInTheDocument();
    });

    it('無効カテゴリをグレーアウト表示する', () => {
      const { container } = render(<CategoryTable {...defaultProps} />);
      // 無効カテゴリの行にopacity-50クラスが適用されていることを確認
      const rows = container.querySelectorAll('tbody tr');
      const inactiveRow = rows[2]; // C カテゴリ（3番目）
      expect(inactiveRow).toHaveClass('opacity-50');
    });
  });

  describe('アクションボタン', () => {
    it('編集ボタンを表示する', () => {
      render(<CategoryTable {...defaultProps} />);
      const editButtons = screen.getAllByRole('button', { name: /編集/ });
      expect(editButtons.length).toBe(3);
    });

    it('削除ボタンを表示する', () => {
      render(<CategoryTable {...defaultProps} />);
      const deleteButtons = screen.getAllByRole('button', { name: /削除/ });
      expect(deleteButtons.length).toBe(3);
    });

    it('編集ボタンクリック時にonEditコールバックを呼び出す', async () => {
      const user = userEvent.setup();
      render(<CategoryTable {...defaultProps} />);
      
      const editButtons = screen.getAllByRole('button', { name: /編集/ });
      await user.click(editButtons[0]);
      
      expect(mockOnEdit).toHaveBeenCalledWith(mockCategories[0]);
      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });

    it('削除ボタンクリック時にonDeleteコールバックを呼び出す', async () => {
      const user = userEvent.setup();
      render(<CategoryTable {...defaultProps} />);
      
      const deleteButtons = screen.getAllByRole('button', { name: /削除/ });
      await user.click(deleteButtons[0]);
      
      expect(mockOnDelete).toHaveBeenCalledWith(1);
      expect(mockOnDelete).toHaveBeenCalledTimes(1);
    });
  });

  describe('有効/無効トグルスイッチ', () => {
    it('各カテゴリ行にトグルスイッチを表示する', () => {
      render(<CategoryTable {...defaultProps} />);
      const toggles = screen.getAllByRole('switch');
      expect(toggles.length).toBe(3);
    });

    it('有効カテゴリのトグルスイッチがON状態である', () => {
      render(<CategoryTable {...defaultProps} />);
      const toggles = screen.getAllByRole('switch');
      expect(toggles[0]).toBeChecked(); // A カテゴリ
      expect(toggles[1]).toBeChecked(); // B カテゴリ
    });

    it('無効カテゴリのトグルスイッチがOFF状態である', () => {
      render(<CategoryTable {...defaultProps} />);
      const toggles = screen.getAllByRole('switch');
      expect(toggles[2]).not.toBeChecked(); // C カテゴリ
    });

    it('トグルスイッチクリック時にonToggleStatusコールバックを呼び出す', async () => {
      const user = userEvent.setup();
      render(<CategoryTable {...defaultProps} />);
      
      const toggles = screen.getAllByRole('switch');
      await user.click(toggles[0]);
      
      expect(mockOnToggleStatus).toHaveBeenCalledWith(1);
      expect(mockOnToggleStatus).toHaveBeenCalledTimes(1);
    });
  });

  describe('ローディング状態', () => {
    it('isLoading=trueの場合、ローディング表示を行う', () => {
      render(<CategoryTable {...defaultProps} isLoading={true} />);
      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    });

    it('isLoading=falseの場合、通常のテーブルを表示する', () => {
      render(<CategoryTable {...defaultProps} isLoading={false} />);
      expect(screen.queryByText('読み込み中...')).not.toBeInTheDocument();
      expect(screen.getByText('仕事について')).toBeInTheDocument();
    });
  });

  describe('空データ表示', () => {
    it('カテゴリが0件の場合、空メッセージを表示する', () => {
      render(<CategoryTable {...defaultProps} categories={[]} />);
      expect(screen.getByText('カテゴリがありません')).toBeInTheDocument();
    });
  });

  describe('ドラッグ&ドロップ並び替え機能', () => {
    it('各カテゴリ行がdraggable属性を持つ', () => {
      const { container } = render(<CategoryTable {...defaultProps} />);
      const rows = container.querySelectorAll('tbody tr');
      
      rows.forEach((row) => {
        expect(row).toHaveAttribute('draggable', 'true');
      });
    });

    it('ドラッグ中の行に視覚的フィードバックを適用する', () => {
      const { container } = render(<CategoryTable {...defaultProps} />);
      const rows = container.querySelectorAll('tbody tr');
      const firstRow = rows[0] as HTMLElement;

      // ドラッグ開始イベントを発火
      const dragStartEvent = new DragEvent('dragstart', { bubbles: true });
      firstRow.dispatchEvent(dragStartEvent);

      // ドラッグ中のクラスが適用されることを確認
      expect(firstRow).toHaveClass('opacity-50');
    });

    it('ドラッグオーバー中の行にハイライトを適用する', () => {
      const { container } = render(<CategoryTable {...defaultProps} />);
      const rows = container.querySelectorAll('tbody tr');
      const secondRow = rows[1] as HTMLElement;

      // ドラッグオーバーイベントを発火
      const dragOverEvent = new DragEvent('dragover', { bubbles: true });
      Object.defineProperty(dragOverEvent, 'preventDefault', { value: vi.fn() });
      secondRow.dispatchEvent(dragOverEvent);

      // ハイライトクラスが適用されることを確認
      expect(secondRow).toHaveClass('bg-blue-50');
    });

    it('ドロップ時にonReorderコールバックを呼び出す', () => {
      const { container } = render(<CategoryTable {...defaultProps} />);
      const rows = container.querySelectorAll('tbody tr');
      const firstRow = rows[0] as HTMLElement;
      const secondRow = rows[1] as HTMLElement;

      // ドラッグ開始（1番目の行）
      const dragStartEvent = new DragEvent('dragstart', { bubbles: true });
      const dataTransfer = new DataTransfer();
      Object.defineProperty(dragStartEvent, 'dataTransfer', { value: dataTransfer });
      firstRow.dispatchEvent(dragStartEvent);

      // ドロップ（2番目の行）
      const dropEvent = new DragEvent('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', { value: dataTransfer });
      Object.defineProperty(dropEvent, 'preventDefault', { value: vi.fn() });
      secondRow.dispatchEvent(dropEvent);

      // onReorderが新しい順序で呼ばれることを確認
      expect(mockOnReorder).toHaveBeenCalled();
      const calledWith = mockOnReorder.mock.calls[0][0];
      expect(Array.isArray(calledWith)).toBe(true);
    });

    it('ドラッグ終了時に視覚的フィードバックをクリアする', () => {
      const { container } = render(<CategoryTable {...defaultProps} />);
      const rows = container.querySelectorAll('tbody tr');
      const firstRow = rows[0] as HTMLElement;

      // ドラッグ開始
      const dragStartEvent = new DragEvent('dragstart', { bubbles: true });
      firstRow.dispatchEvent(dragStartEvent);

      // ドラッグ終了
      const dragEndEvent = new DragEvent('dragend', { bubbles: true });
      firstRow.dispatchEvent(dragEndEvent);

      // ドラッグ中のクラスが削除されることを確認
      expect(firstRow).not.toHaveClass('opacity-50');
    });
  });

  describe('無効化時の警告アイコン表示', () => {
    it('関連質問が存在する無効カテゴリに警告アイコンを表示する', () => {
      const categoriesWithInactiveWithQuestions: CategoryWithQuestionCount[] = [
        {
          id: 1,
          code: 'A',
          name: '仕事について',
          description: '業務内容・負荷・やりがい',
          display_order: 1,
          is_active: false,
          question_count: 5,
          created_at: '2025-10-01T00:00:00Z',
          updated_at: '2025-10-01T00:00:00Z',
        },
      ];

      render(<CategoryTable {...defaultProps} categories={categoriesWithInactiveWithQuestions} />);
      
      // 警告アイコンの存在を確認
      expect(screen.getByRole('img', { name: /警告/ })).toBeInTheDocument();
    });

    it('関連質問が存在しない無効カテゴリに警告アイコンを表示しない', () => {
      const categoriesWithInactiveNoQuestions: CategoryWithQuestionCount[] = [
        {
          id: 1,
          code: 'A',
          name: '仕事について',
          description: '業務内容・負荷・やりがい',
          display_order: 1,
          is_active: false,
          question_count: 0,
          created_at: '2025-10-01T00:00:00Z',
          updated_at: '2025-10-01T00:00:00Z',
        },
      ];

      render(<CategoryTable {...defaultProps} categories={categoriesWithInactiveNoQuestions} />);
      
      // 警告アイコンが存在しないことを確認
      expect(screen.queryByRole('img', { name: /警告/ })).not.toBeInTheDocument();
    });

    it('有効カテゴリに警告アイコンを表示しない', () => {
      const categoriesWithActive: CategoryWithQuestionCount[] = [
        {
          id: 1,
          code: 'A',
          name: '仕事について',
          description: '業務内容・負荷・やりがい',
          display_order: 1,
          is_active: true,
          question_count: 5,
          created_at: '2025-10-01T00:00:00Z',
          updated_at: '2025-10-01T00:00:00Z',
        },
      ];

      render(<CategoryTable {...defaultProps} categories={categoriesWithActive} />);
      
      // 警告アイコンが存在しないことを確認
      expect(screen.queryByRole('img', { name: /警告/ })).not.toBeInTheDocument();
    });

    it('警告アイコンにツールチップメッセージを表示する', () => {
      const categoriesWithInactiveWithQuestions: CategoryWithQuestionCount[] = [
        {
          id: 1,
          code: 'A',
          name: '仕事について',
          description: '業務内容・負荷・やりがい',
          display_order: 1,
          is_active: false,
          question_count: 5,
          created_at: '2025-10-01T00:00:00Z',
          updated_at: '2025-10-01T00:00:00Z',
        },
      ];

      render(<CategoryTable {...defaultProps} categories={categoriesWithInactiveWithQuestions} />);
      
      // ツールチップのtitle属性を確認
      const warningIcon = screen.getByRole('img', { name: /警告/ });
      expect(warningIcon).toHaveAttribute('title', '関連する質問が5件存在します');
    });
  });
});
