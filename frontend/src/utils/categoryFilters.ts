import type { CategoryWithQuestionCount, CategoryFilterType } from '@/types/category';

/**
 * カテゴリをフィルタリングする
 * @param categories フィルタリング対象のカテゴリ配列
 * @param searchQuery 検索クエリ（カテゴリコード、名称、説明を対象に部分一致検索）
 * @param activeFilter アクティブフィルタ（all, active, inactive）
 * @returns フィルタリングされたカテゴリ配列
 */
export const filterCategories = (
  categories: CategoryWithQuestionCount[],
  searchQuery: string,
  activeFilter: CategoryFilterType
): CategoryWithQuestionCount[] => {
  return categories.filter((category) => {
    // アクティブフィルタチェック
    if (activeFilter === 'active' && !category.is_active) return false;
    if (activeFilter === 'inactive' && category.is_active) return false;

    // 検索クエリチェック
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesCode = category.code.toLowerCase().includes(query);
      const matchesName = category.name.toLowerCase().includes(query);
      const matchesDescription = category.description?.toLowerCase().includes(query) || false;

      return matchesCode || matchesName || matchesDescription;
    }

    return true;
  });
};

/**
 * カテゴリコードで検索する
 * @param categories カテゴリ配列
 * @param code カテゴリコード
 * @returns 一致するカテゴリまたはundefined
 */
export const findCategoryByCode = (
  categories: CategoryWithQuestionCount[],
  code: string
): CategoryWithQuestionCount | undefined => {
  return categories.find((category) => category.code.toLowerCase() === code.toLowerCase());
};

/**
 * カテゴリをソートする
 * @param categories カテゴリ配列
 * @returns display_order でソートされたカテゴリ配列
 */
export const sortCategoriesByOrder = (
  categories: CategoryWithQuestionCount[]
): CategoryWithQuestionCount[] => {
  return [...categories].sort((a, b) => a.display_order - b.display_order);
};
