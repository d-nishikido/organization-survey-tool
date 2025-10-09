import React from 'react';
import type { CategoryFilterType } from '@/types/category';

interface CategorySearchFilterProps {
  searchQuery: string;
  activeFilter: CategoryFilterType;
  onSearchChange: (query: string) => void;
  onFilterChange: (filter: CategoryFilterType) => void;
}

export const CategorySearchFilter: React.FC<CategorySearchFilterProps> = ({
  searchQuery,
  activeFilter,
  onSearchChange,
  onFilterChange,
}) => {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      {/* 検索ボックス */}
      <div className="flex-1">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="カテゴリコード、名称、説明で検索"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* フィルタボタン */}
      <div className="flex gap-2">
        <button
          onClick={() => onFilterChange('all')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeFilter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          すべて
        </button>
        <button
          onClick={() => onFilterChange('active')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeFilter === 'active'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          有効のみ
        </button>
        <button
          onClick={() => onFilterChange('inactive')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeFilter === 'inactive'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          無効のみ
        </button>
      </div>
    </div>
  );
};
