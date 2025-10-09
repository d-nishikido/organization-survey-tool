import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from 'react-query';
import { categoryService } from '../api/services/categoryService';
import type {
  CategoryWithQuestionCount,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../types/question';

const CATEGORIES_QUERY_KEY = 'categories';
const STALE_TIME_5_MINUTES = 5 * 60 * 1000; // 5分

/**
 * カテゴリ一覧取得フック
 * @param active - true: アクティブのみ, false: 非アクティブのみ, undefined: 全て
 * @returns カテゴリ一覧のクエリ結果
 */
export const useCategories = (
  active: boolean | undefined = true
): UseQueryResult<CategoryWithQuestionCount[], Error> => {
  return useQuery<CategoryWithQuestionCount[], Error>(
    [CATEGORIES_QUERY_KEY, active],
    () => categoryService.getCategories({ active }),
    {
      staleTime: STALE_TIME_5_MINUTES,
    }
  );
};

/**
 * カテゴリ作成フック
 * @returns カテゴリ作成のミューテーション
 */
export const useCreateCategory = (): UseMutationResult<
  CategoryWithQuestionCount,
  Error,
  CreateCategoryInput
> => {
  const queryClient = useQueryClient();

  return useMutation<CategoryWithQuestionCount, Error, CreateCategoryInput>(
    (data) => categoryService.createCategory(data),
    {
      // 楽観的更新: 作成前にキャッシュを更新
      onMutate: async (newCategory) => {
        // 進行中のクエリをキャンセル
        await queryClient.cancelQueries(CATEGORIES_QUERY_KEY);

        // 前のデータをスナップショット
        const previousCategories = queryClient.getQueryData<CategoryWithQuestionCount[]>([
          CATEGORIES_QUERY_KEY,
          true,
        ]);

        // 楽観的更新: 一時的なIDで新規カテゴリを追加
        if (previousCategories) {
          const tempCategory: CategoryWithQuestionCount = {
            id: Date.now(), // 一時的なID
            code: newCategory.code,
            name: newCategory.name,
            description: newCategory.description || '',
            display_order: newCategory.display_order,
            is_active: newCategory.is_active,
            question_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          queryClient.setQueryData<CategoryWithQuestionCount[]>(
            [CATEGORIES_QUERY_KEY, true],
            [...previousCategories, tempCategory]
          );
        }

        return { previousCategories };
      },
      // エラー時にロールバック
      onError: (err, newCategory, context) => {
        if (context?.previousCategories) {
          queryClient.setQueryData<CategoryWithQuestionCount[]>(
            [CATEGORIES_QUERY_KEY, true],
            context.previousCategories
          );
        }
      },
      // 成功時にクエリを無効化して最新データを取得
      onSuccess: () => {
        queryClient.invalidateQueries(CATEGORIES_QUERY_KEY);
      },
    }
  );
};

/**
 * カテゴリ更新フック
 * @returns カテゴリ更新のミューテーション
 */
export const useUpdateCategory = (): UseMutationResult<
  CategoryWithQuestionCount,
  Error,
  { id: number; data: UpdateCategoryInput }
> => {
  const queryClient = useQueryClient();

  return useMutation<
    CategoryWithQuestionCount,
    Error,
    { id: number; data: UpdateCategoryInput }
  >(({ id, data }) => categoryService.updateCategory(id, data), {
    // 楽観的更新: 更新前にキャッシュを更新
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries(CATEGORIES_QUERY_KEY);

      // すべてのactiveパラメータのクエリのスナップショット
      const previousQueries = new Map<string, CategoryWithQuestionCount[] | undefined>();
      [true, false, undefined].forEach((activeValue) => {
        const key = JSON.stringify([CATEGORIES_QUERY_KEY, activeValue]);
        const queryData = queryClient.getQueryData<CategoryWithQuestionCount[]>([
          CATEGORIES_QUERY_KEY,
          activeValue,
        ]);
        previousQueries.set(key, queryData);
      });

      // 楽観的更新: 各クエリのデータを更新
      [true, false, undefined].forEach((activeValue) => {
        const categories = queryClient.getQueryData<CategoryWithQuestionCount[]>([
          CATEGORIES_QUERY_KEY,
          activeValue,
        ]);

        if (categories) {
          const updatedCategories = categories.map((cat) =>
            cat.id === id ? { ...cat, ...data, updated_at: new Date().toISOString() } : cat
          );
          queryClient.setQueryData<CategoryWithQuestionCount[]>(
            [CATEGORIES_QUERY_KEY, activeValue],
            updatedCategories
          );
        }
      });

      return { previousQueries };
    },
    // エラー時にロールバック
    onError: (err, variables, context) => {
      if (context?.previousQueries) {
        context.previousQueries.forEach((data, key) => {
          const [, activeValue] = JSON.parse(key);
          queryClient.setQueryData<CategoryWithQuestionCount[]>(
            [CATEGORIES_QUERY_KEY, activeValue],
            data
          );
        });
      }
    },
    // 成功時にクエリを無効化
    onSuccess: () => {
      queryClient.invalidateQueries(CATEGORIES_QUERY_KEY);
    },
  });
};

/**
 * カテゴリ削除フック
 * @returns カテゴリ削除のミューテーション
 */
export const useDeleteCategory = (): UseMutationResult<void, Error, number> => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>(
    (id) => categoryService.deleteCategory(id),
    {
      // 楽観的更新: 削除前にキャッシュから削除
      onMutate: async (id) => {
        await queryClient.cancelQueries(CATEGORIES_QUERY_KEY);

        const previousQueries = new Map<string, CategoryWithQuestionCount[] | undefined>();
        [true, false, undefined].forEach((activeValue) => {
          const key = JSON.stringify([CATEGORIES_QUERY_KEY, activeValue]);
          const queryData = queryClient.getQueryData<CategoryWithQuestionCount[]>([
            CATEGORIES_QUERY_KEY,
            activeValue,
          ]);
          previousQueries.set(key, queryData);

          // 楽観的更新: 削除対象を除外
          if (queryData) {
            const filtered = queryData.filter((cat) => cat.id !== id);
            queryClient.setQueryData<CategoryWithQuestionCount[]>(
              [CATEGORIES_QUERY_KEY, activeValue],
              filtered
            );
          }
        });

        return { previousQueries };
      },
      // エラー時にロールバック
      onError: (err, id, context) => {
        if (context?.previousQueries) {
          context.previousQueries.forEach((data, key) => {
            const [, activeValue] = JSON.parse(key);
            queryClient.setQueryData<CategoryWithQuestionCount[]>(
              [CATEGORIES_QUERY_KEY, activeValue],
              data
            );
          });
        }
      },
      // 成功時にクエリを無効化
      onSuccess: () => {
        queryClient.invalidateQueries(CATEGORIES_QUERY_KEY);
      },
    }
  );
};

/**
 * カテゴリステータス切り替えフック
 * @returns ステータス切り替えのミューテーション
 */
export const useToggleCategoryStatus = (): UseMutationResult<
  CategoryWithQuestionCount,
  Error,
  number
> => {
  const queryClient = useQueryClient();

  return useMutation<CategoryWithQuestionCount, Error, number>(
    (id) => categoryService.toggleCategoryStatus(id),
    {
      // 楽観的更新: ステータス切り替え前にキャッシュを更新
      onMutate: async (id) => {
        await queryClient.cancelQueries(CATEGORIES_QUERY_KEY);

        const previousQueries = new Map<string, CategoryWithQuestionCount[] | undefined>();
        [true, false, undefined].forEach((activeValue) => {
          const key = JSON.stringify([CATEGORIES_QUERY_KEY, activeValue]);
          const queryData = queryClient.getQueryData<CategoryWithQuestionCount[]>([
            CATEGORIES_QUERY_KEY,
            activeValue,
          ]);
          previousQueries.set(key, queryData);

          // 楽観的更新: is_activeを反転
          if (queryData) {
            const updated = queryData.map((cat) =>
              cat.id === id
                ? { ...cat, is_active: !cat.is_active, updated_at: new Date().toISOString() }
                : cat
            );
            queryClient.setQueryData<CategoryWithQuestionCount[]>(
              [CATEGORIES_QUERY_KEY, activeValue],
              updated
            );
          }
        });

        return { previousQueries };
      },
      // エラー時にロールバック
      onError: (err, id, context) => {
        if (context?.previousQueries) {
          context.previousQueries.forEach((data, key) => {
            const [, activeValue] = JSON.parse(key);
            queryClient.setQueryData<CategoryWithQuestionCount[]>(
              [CATEGORIES_QUERY_KEY, activeValue],
              data
            );
          });
        }
      },
      // 成功時にクエリを無効化
      onSuccess: () => {
        queryClient.invalidateQueries(CATEGORIES_QUERY_KEY);
      },
    }
  );
};

/**
 * カテゴリ並び替えフック
 * @returns 並び替えのミューテーション
 */
export const useReorderCategories = (): UseMutationResult<void, Error, number[]> => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number[]>(
    (orderedIds) => categoryService.reorderCategories(orderedIds),
    {
      // 楽観的更新: 並び替え前にキャッシュを更新
      onMutate: async (orderedIds) => {
        await queryClient.cancelQueries(CATEGORIES_QUERY_KEY);

        const previousQueries = new Map<string, CategoryWithQuestionCount[] | undefined>();
        [true, false, undefined].forEach((activeValue) => {
          const key = JSON.stringify([CATEGORIES_QUERY_KEY, activeValue]);
          const queryData = queryClient.getQueryData<CategoryWithQuestionCount[]>([
            CATEGORIES_QUERY_KEY,
            activeValue,
          ]);
          previousQueries.set(key, queryData);

          // 楽観的更新: 並び順を更新
          if (queryData) {
            const reordered = [...queryData].sort((a, b) => {
              const indexA = orderedIds.indexOf(a.id);
              const indexB = orderedIds.indexOf(b.id);
              if (indexA === -1 || indexB === -1) return 0;
              return indexA - indexB;
            });
            queryClient.setQueryData<CategoryWithQuestionCount[]>(
              [CATEGORIES_QUERY_KEY, activeValue],
              reordered
            );
          }
        });

        return { previousQueries };
      },
      // エラー時にロールバック
      onError: (err, orderedIds, context) => {
        if (context?.previousQueries) {
          context.previousQueries.forEach((data, key) => {
            const [, activeValue] = JSON.parse(key);
            queryClient.setQueryData<CategoryWithQuestionCount[]>(
              [CATEGORIES_QUERY_KEY, activeValue],
              data
            );
          });
        }
      },
      // 成功時にクエリを無効化
      onSuccess: () => {
        queryClient.invalidateQueries(CATEGORIES_QUERY_KEY);
      },
    }
  );
};
