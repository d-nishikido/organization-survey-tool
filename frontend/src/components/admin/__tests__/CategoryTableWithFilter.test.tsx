import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategorySearchFilter } from '../CategorySearchFilter';
import { CategoryTable } from '../CategoryTable';
import type { CategoryWithQuestionCount } from '@/types/category';
import React, { useState } from 'react';

// 統合テスト用のラッパーコンポーネント
const CategoryManagementWithFilter = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const allCategories: CategoryWithQuestionCount[] = [
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

  // フィルタリングロジック
  const filteredCategories = allCategories.filter((category) => {
    // アクティブフィルタ
    if (activeFilter === 'active' && !category.is_active) return false;
    if (activeFilter === 'inactive' && category.is_active) return false;

    // 検索クエリフィルタ
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesCode = category.code.toLowerCase().includes(query);
      const matchesName = category.name.toLowerCase().includes(query);
      const matchesDescription = category.description?.toLowerCase().includes(query) || false;
      
      return matchesCode || matchesName || matchesDescription;
    }

    return true;
  });

  return (
    <div>
      <CategorySearchFilter
        searchQuery={searchQuery}
        activeFilter={activeFilter}
        onSearchChange={setSearchQuery}
        onFilterChange={setActiveFilter}
      />
      <CategoryTable
        categories={filteredCategories}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onToggleStatus={vi.fn()}
        onReorder={vi.fn()}
        isLoading={false}
      />
    </div>
  );
};

describe('CategoryTableWithFilter（統合テスト）', () => {
  describe('検索機能', () => {
    it('カテゴリコードで検索できる', async () => {
      const user = userEvent.setup();
      render(<CategoryManagementWithFilter />);
      
      // 初期状態: 全カテゴリ表示
      expect(screen.getByText('仕事について')).toBeInTheDocument();
      expect(screen.getByText('最近の状態について')).toBeInTheDocument();
      expect(screen.getByText('周りの方々について')).toBeInTheDocument();
      
      // 'A'で検索
      const searchInput = screen.getByPlaceholderText(/検索/);
      await user.type(searchInput, 'A');
      
      // A カテゴリのみ表示
      expect(screen.getByText('仕事について')).toBeInTheDocument();
      expect(screen.queryByText('最近の状態について')).not.toBeInTheDocument();
      expect(screen.queryByText('周りの方々について')).not.toBeInTheDocument();
    });

    it('カテゴリ名で検索できる', async () => {
      const user = userEvent.setup();
      render(<CategoryManagementWithFilter />);
      
      const searchInput = screen.getByPlaceholderText(/検索/);
      await user.type(searchInput, '仕事');
      
      expect(screen.getByText('仕事について')).toBeInTheDocument();
      expect(screen.queryByText('最近の状態について')).not.toBeInTheDocument();
      expect(screen.queryByText('周りの方々について')).not.toBeInTheDocument();
    });

    it('説明文で検索できる', async () => {
      const user = userEvent.setup();
      render(<CategoryManagementWithFilter />);
      
      const searchInput = screen.getByPlaceholderText(/検索/);
      await user.type(searchInput, 'ストレス');
      
      expect(screen.queryByText('仕事について')).not.toBeInTheDocument();
      expect(screen.getByText('最近の状態について')).toBeInTheDocument();
      expect(screen.queryByText('周りの方々について')).not.toBeInTheDocument();
    });

    it('部分一致で検索できる', async () => {
      const user = userEvent.setup();
      render(<CategoryManagementWithFilter />);
      
      const searchInput = screen.getByPlaceholderText(/検索/);
      await user.type(searchInput, 'について');
      
      // 全カテゴリ名に「について」が含まれる
      expect(screen.getByText('仕事について')).toBeInTheDocument();
      expect(screen.getByText('最近の状態について')).toBeInTheDocument();
      expect(screen.getByText('周りの方々について')).toBeInTheDocument();
    });

    it('大文字小文字を区別しない検索ができる', async () => {
      const user = userEvent.setup();
      render(<CategoryManagementWithFilter />);
      
      const searchInput = screen.getByPlaceholderText(/検索/);
      await user.type(searchInput, 'a');
      
      // 'A'カテゴリが見つかる
      expect(screen.getByText('仕事について')).toBeInTheDocument();
    });
  });

  describe('フィルタ機能', () => {
    it('「有効のみ」フィルタで有効カテゴリのみ表示する', async () => {
      const user = userEvent.setup();
      render(<CategoryManagementWithFilter />);
      
      const activeButton = screen.getByRole('button', { name: '有効のみ' });
      await user.click(activeButton);
      
      expect(screen.getByText('仕事について')).toBeInTheDocument();
      expect(screen.getByText('最近の状態について')).toBeInTheDocument();
      expect(screen.queryByText('周りの方々について')).not.toBeInTheDocument();
    });

    it('「無効のみ」フィルタで無効カテゴリのみ表示する', async () => {
      const user = userEvent.setup();
      render(<CategoryManagementWithFilter />);
      
      const inactiveButton = screen.getByRole('button', { name: '無効のみ' });
      await user.click(inactiveButton);
      
      expect(screen.queryByText('仕事について')).not.toBeInTheDocument();
      expect(screen.queryByText('最近の状態について')).not.toBeInTheDocument();
      expect(screen.getByText('周りの方々について')).toBeInTheDocument();
    });

    it('「すべて」フィルタで全カテゴリを表示する', async () => {
      const user = userEvent.setup();
      render(<CategoryManagementWithFilter />);
      
      // まず「有効のみ」に切り替え
      const activeButton = screen.getByRole('button', { name: '有効のみ' });
      await user.click(activeButton);
      
      // 「すべて」に戻す
      const allButton = screen.getByRole('button', { name: 'すべて' });
      await user.click(allButton);
      
      expect(screen.getByText('仕事について')).toBeInTheDocument();
      expect(screen.getByText('最近の状態について')).toBeInTheDocument();
      expect(screen.getByText('周りの方々について')).toBeInTheDocument();
    });
  });

  describe('検索とフィルタの組み合わせ', () => {
    it('検索とフィルタを同時に適用できる', async () => {
      const user = userEvent.setup();
      render(<CategoryManagementWithFilter />);
      
      // 「有効のみ」フィルタを適用
      const activeButton = screen.getByRole('button', { name: '有効のみ' });
      await user.click(activeButton);
      
      // さらに「仕事」で検索
      const searchInput = screen.getByPlaceholderText(/検索/);
      await user.type(searchInput, '仕事');
      
      // 有効かつ「仕事」を含むカテゴリのみ表示
      expect(screen.getByText('仕事について')).toBeInTheDocument();
      expect(screen.queryByText('最近の状態について')).not.toBeInTheDocument();
      expect(screen.queryByText('周りの方々について')).not.toBeInTheDocument();
    });
  });

  describe('検索結果0件時の表示', () => {
    it('検索条件に一致するカテゴリがない場合、空メッセージを表示する', async () => {
      const user = userEvent.setup();
      render(<CategoryManagementWithFilter />);
      
      const searchInput = screen.getByPlaceholderText(/検索/);
      await user.type(searchInput, '存在しないキーワード');
      
      expect(screen.getByText('カテゴリがありません')).toBeInTheDocument();
      expect(screen.queryByText('仕事について')).not.toBeInTheDocument();
    });

    it('フィルタ条件に一致するカテゴリがない場合、空メッセージを表示する', async () => {
      const user = userEvent.setup();
      render(<CategoryManagementWithFilter />);
      
      // 「無効のみ」フィルタを適用
      const inactiveButton = screen.getByRole('button', { name: '無効のみ' });
      await user.click(inactiveButton);
      
      // さらに「仕事」で検索（無効カテゴリには該当しない）
      const searchInput = screen.getByPlaceholderText(/検索/);
      await user.type(searchInput, '仕事');
      
      expect(screen.getByText('カテゴリがありません')).toBeInTheDocument();
    });
  });
});
