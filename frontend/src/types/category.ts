// カテゴリエンティティ
export interface CategoryEntity {
  id: number;
  code: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 関連質問数を含むカテゴリ（一覧表示用）
export interface CategoryWithQuestionCount extends CategoryEntity {
  question_count: number;
}

// カテゴリ作成入力
export interface CreateCategoryInput {
  code: string;
  name: string;
  description?: string;
  display_order: number;
  is_active?: boolean;
}

// カテゴリ更新入力
export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  display_order?: number;
  is_active?: boolean;
}

// カテゴリ並び替えリクエスト
export interface ReorderCategoriesRequest {
  orderedIds: number[];
}

// フィルタタイプ
export type CategoryFilterType = 'all' | 'active' | 'inactive';

// カテゴリ検索・フィルタ状態
export interface CategoryFilterState {
  searchQuery: string;
  activeFilter: CategoryFilterType;
}
