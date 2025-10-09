import { describe, it, expect } from 'vitest';
import { filterCategories, findCategoryByCode, sortCategoriesByOrder } from '../categoryFilters';
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

describe('categoryFilters', () => {
  describe('filterCategories', () => {
    describe('アクティブフィルタのみ', () => {
      it('activeFilter="all"の場合、全カテゴリを返す', () => {
        const result = filterCategories(mockCategories, '', 'all');
        expect(result).toHaveLength(3);
      });

      it('activeFilter="active"の場合、有効カテゴリのみを返す', () => {
        const result = filterCategories(mockCategories, '', 'active');
        expect(result).toHaveLength(2);
        expect(result.every((cat) => cat.is_active)).toBe(true);
      });

      it('activeFilter="inactive"の場合、無効カテゴリのみを返す', () => {
        const result = filterCategories(mockCategories, '', 'inactive');
        expect(result).toHaveLength(1);
        expect(result[0].is_active).toBe(false);
      });
    });

    describe('検索クエリのみ', () => {
      it('カテゴリコードで検索できる', () => {
        const result = filterCategories(mockCategories, 'A', 'all');
        expect(result).toHaveLength(1);
        expect(result[0].code).toBe('A');
      });

      it('カテゴリ名で検索できる', () => {
        const result = filterCategories(mockCategories, '仕事', 'all');
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('仕事について');
      });

      it('説明文で検索できる', () => {
        const result = filterCategories(mockCategories, 'ストレス', 'all');
        expect(result).toHaveLength(1);
        expect(result[0].code).toBe('B');
      });

      it('部分一致で検索できる', () => {
        const result = filterCategories(mockCategories, 'について', 'all');
        expect(result).toHaveLength(3);
      });

      it('大文字小文字を区別しない', () => {
        const result = filterCategories(mockCategories, 'a', 'all');
        expect(result).toHaveLength(1);
        expect(result[0].code).toBe('A');
      });

      it('一致するカテゴリがない場合、空配列を返す', () => {
        const result = filterCategories(mockCategories, '存在しない', 'all');
        expect(result).toHaveLength(0);
      });
    });

    describe('検索クエリとアクティブフィルタの組み合わせ', () => {
      it('有効カテゴリの中から検索できる', () => {
        const result = filterCategories(mockCategories, '仕事', 'active');
        expect(result).toHaveLength(1);
        expect(result[0].code).toBe('A');
        expect(result[0].is_active).toBe(true);
      });

      it('無効カテゴリの中から検索できる', () => {
        const result = filterCategories(mockCategories, '周り', 'inactive');
        expect(result).toHaveLength(1);
        expect(result[0].code).toBe('C');
        expect(result[0].is_active).toBe(false);
      });

      it('両方の条件を満たさない場合、空配列を返す', () => {
        const result = filterCategories(mockCategories, '仕事', 'inactive');
        expect(result).toHaveLength(0);
      });
    });

    describe('空の検索クエリ', () => {
      it('空文字列の場合、アクティブフィルタのみ適用される', () => {
        const result = filterCategories(mockCategories, '', 'active');
        expect(result).toHaveLength(2);
      });
    });
  });

  describe('findCategoryByCode', () => {
    it('カテゴリコードで検索できる', () => {
      const result = findCategoryByCode(mockCategories, 'A');
      expect(result).toBeDefined();
      expect(result?.code).toBe('A');
    });

    it('大文字小文字を区別しない', () => {
      const result = findCategoryByCode(mockCategories, 'a');
      expect(result).toBeDefined();
      expect(result?.code).toBe('A');
    });

    it('存在しないコードの場合、undefinedを返す', () => {
      const result = findCategoryByCode(mockCategories, 'Z');
      expect(result).toBeUndefined();
    });
  });

  describe('sortCategoriesByOrder', () => {
    it('display_orderでソートされる', () => {
      const unsorted: CategoryWithQuestionCount[] = [
        { ...mockCategories[2], display_order: 3 },
        { ...mockCategories[0], display_order: 1 },
        { ...mockCategories[1], display_order: 2 },
      ];
      
      const result = sortCategoriesByOrder(unsorted);
      expect(result[0].display_order).toBe(1);
      expect(result[1].display_order).toBe(2);
      expect(result[2].display_order).toBe(3);
    });

    it('元の配列を変更しない', () => {
      const original = [...mockCategories];
      const sorted = sortCategoriesByOrder(mockCategories);
      
      expect(original).toEqual(mockCategories);
      expect(sorted).not.toBe(mockCategories);
    });
  });
});
