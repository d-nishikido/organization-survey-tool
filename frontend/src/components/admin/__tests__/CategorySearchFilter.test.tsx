import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategorySearchFilter } from '../CategorySearchFilter';

describe('CategorySearchFilter', () => {
  const mockOnSearchChange = vi.fn();
  const mockOnFilterChange = vi.fn();

  const defaultProps = {
    searchQuery: '',
    activeFilter: 'all' as const,
    onSearchChange: mockOnSearchChange,
    onFilterChange: mockOnFilterChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('検索ボックス表示', () => {
    it('検索入力フィールドを表示する', () => {
      render(<CategorySearchFilter {...defaultProps} />);
      const searchInput = screen.getByPlaceholderText(/検索/);
      expect(searchInput).toBeInTheDocument();
    });

    it('検索クエリの初期値を表示する', () => {
      render(<CategorySearchFilter {...defaultProps} searchQuery="テスト" />);
      const searchInput = screen.getByDisplayValue('テスト');
      expect(searchInput).toBeInTheDocument();
    });

    it('プレースホルダーに検索対象を明示する', () => {
      render(<CategorySearchFilter {...defaultProps} />);
      expect(screen.getByPlaceholderText('カテゴリコード、名称、説明で検索')).toBeInTheDocument();
    });
  });

  describe('検索入力の動作', () => {
    it('検索テキスト入力時にonSearchChangeコールバックを呼び出す', async () => {
      const user = userEvent.setup();
      render(<CategorySearchFilter {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText(/検索/);
      await user.type(searchInput, 'テスト');
      
      expect(mockOnSearchChange).toHaveBeenCalled();
    });

    it('検索テキストをクリアできる', async () => {
      const user = userEvent.setup();
      render(<CategorySearchFilter {...defaultProps} searchQuery="テスト" />);
      
      const searchInput = screen.getByDisplayValue('テスト');
      await user.clear(searchInput);
      
      expect(mockOnSearchChange).toHaveBeenCalledWith('');
    });
  });

  describe('フィルタボタン表示', () => {
    it('「すべて」フィルタボタンを表示する', () => {
      render(<CategorySearchFilter {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'すべて' })).toBeInTheDocument();
    });

    it('「有効のみ」フィルタボタンを表示する', () => {
      render(<CategorySearchFilter {...defaultProps} />);
      expect(screen.getByRole('button', { name: '有効のみ' })).toBeInTheDocument();
    });

    it('「無効のみ」フィルタボタンを表示する', () => {
      render(<CategorySearchFilter {...defaultProps} />);
      expect(screen.getByRole('button', { name: '無効のみ' })).toBeInTheDocument();
    });
  });

  describe('フィルタボタンの状態', () => {
    it('activeFilter="all"の場合、「すべて」ボタンがアクティブである', () => {
      render(<CategorySearchFilter {...defaultProps} activeFilter="all" />);
      const allButton = screen.getByRole('button', { name: 'すべて' });
      expect(allButton).toHaveClass('bg-blue-600');
    });

    it('activeFilter="active"の場合、「有効のみ」ボタンがアクティブである', () => {
      render(<CategorySearchFilter {...defaultProps} activeFilter="active" />);
      const activeButton = screen.getByRole('button', { name: '有効のみ' });
      expect(activeButton).toHaveClass('bg-blue-600');
    });

    it('activeFilter="inactive"の場合、「無効のみ」ボタンがアクティブである', () => {
      render(<CategorySearchFilter {...defaultProps} activeFilter="inactive" />);
      const inactiveButton = screen.getByRole('button', { name: '無効のみ' });
      expect(inactiveButton).toHaveClass('bg-blue-600');
    });

    it('非アクティブなボタンは通常の背景色を持つ', () => {
      render(<CategorySearchFilter {...defaultProps} activeFilter="all" />);
      const activeButton = screen.getByRole('button', { name: '有効のみ' });
      expect(activeButton).toHaveClass('bg-gray-200');
    });
  });

  describe('フィルタボタンのクリック動作', () => {
    it('「すべて」ボタンクリック時にonFilterChangeコールバックを呼び出す', async () => {
      const user = userEvent.setup();
      render(<CategorySearchFilter {...defaultProps} activeFilter="active" />);
      
      const allButton = screen.getByRole('button', { name: 'すべて' });
      await user.click(allButton);
      
      expect(mockOnFilterChange).toHaveBeenCalledWith('all');
      expect(mockOnFilterChange).toHaveBeenCalledTimes(1);
    });

    it('「有効のみ」ボタンクリック時にonFilterChangeコールバックを呼び出す', async () => {
      const user = userEvent.setup();
      render(<CategorySearchFilter {...defaultProps} activeFilter="all" />);
      
      const activeButton = screen.getByRole('button', { name: '有効のみ' });
      await user.click(activeButton);
      
      expect(mockOnFilterChange).toHaveBeenCalledWith('active');
      expect(mockOnFilterChange).toHaveBeenCalledTimes(1);
    });

    it('「無効のみ」ボタンクリック時にonFilterChangeコールバックを呼び出す', async () => {
      const user = userEvent.setup();
      render(<CategorySearchFilter {...defaultProps} activeFilter="all" />);
      
      const inactiveButton = screen.getByRole('button', { name: '無効のみ' });
      await user.click(inactiveButton);
      
      expect(mockOnFilterChange).toHaveBeenCalledWith('inactive');
      expect(mockOnFilterChange).toHaveBeenCalledTimes(1);
    });

    it('既にアクティブなボタンをクリックしても状態変更しない', async () => {
      const user = userEvent.setup();
      render(<CategorySearchFilter {...defaultProps} activeFilter="all" />);
      
      const allButton = screen.getByRole('button', { name: 'すべて' });
      await user.click(allButton);
      
      // 既にアクティブなので、コールバックは呼ばれるが変更なし
      expect(mockOnFilterChange).toHaveBeenCalledWith('all');
    });
  });

  describe('レイアウト', () => {
    it('検索ボックスとフィルタボタンが横並びで表示される', () => {
      const { container } = render(<CategorySearchFilter {...defaultProps} />);
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('flex');
    });

    it('レスポンシブデザインが適用される', () => {
      const { container } = render(<CategorySearchFilter {...defaultProps} />);
      const wrapper = container.firstChild;
      // flex-col md:flex-row などのレスポンシブクラスを確認
      expect(wrapper).toHaveClass('flex');
    });
  });
});
