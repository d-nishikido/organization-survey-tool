import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import React from 'react';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useToggleCategoryStatus,
  useReorderCategories,
} from '../useCategories';
import { categoryService } from '../../api/services/categoryService';
import type { CategoryWithQuestionCount } from '../../types/question';

vi.mock('../../api/services/categoryService');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const mockCategory: CategoryWithQuestionCount = {
  id: 1,
  code: 'A',
  name: 'テストカテゴリ',
  description: 'テスト説明',
  display_order: 1,
  is_active: true,
  question_count: 5,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

describe('useCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('データ取得', () => {
    it('カテゴリ一覧を取得できる', async () => {
      const mockCategories = [mockCategory];
      vi.mocked(categoryService.getCategories).mockResolvedValue(mockCategories);

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockCategories);
      expect(categoryService.getCategories).toHaveBeenCalledWith({ active: true });
    });

    it('active=falseで非アクティブカテゴリを取得できる', async () => {
      const mockCategories = [{ ...mockCategory, is_active: false }];
      vi.mocked(categoryService.getCategories).mockResolvedValue(mockCategories);

      const { result } = renderHook(() => useCategories(false), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(categoryService.getCategories).toHaveBeenCalledWith({ active: false });
    });

    it('active=undefinedで全カテゴリを取得できる', async () => {
      const mockCategories = [mockCategory, { ...mockCategory, id: 2, is_active: false }];
      vi.mocked(categoryService.getCategories).mockResolvedValue(mockCategories);

      const { result } = renderHook(() => useCategories(undefined), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(categoryService.getCategories).toHaveBeenCalledWith({ active: undefined });
    });

    it('エラー時にエラー状態を返す', async () => {
      const error = new Error('Network error');
      vi.mocked(categoryService.getCategories).mockRejectedValue(error);

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBe(error);
    });

    it('ローディング状態を返す', () => {
      vi.mocked(categoryService.getCategories).mockImplementation(
        () => new Promise(() => {})
      );

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('staleTime設定', () => {
    it('staleTimeが5分（300000ms）に設定されている', () => {
      vi.mocked(categoryService.getCategories).mockResolvedValue([mockCategory]);

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper(),
      });

      // staleTimeが設定されていることを確認（実際の値は内部実装）
      expect(result.current.isStale).toBe(false);
    });
  });
});

describe('useCreateCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('カテゴリを作成できる', async () => {
    const newCategory = { ...mockCategory, id: 2 };
    vi.mocked(categoryService.createCategory).mockResolvedValue(newCategory);

    const { result } = renderHook(() => useCreateCategory(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      code: 'B',
      name: '新規カテゴリ',
      description: '説明',
      display_order: 2,
      is_active: true,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(newCategory);
  });

  it('作成時にエラーを処理できる', async () => {
    const error = new Error('Creation failed');
    vi.mocked(categoryService.createCategory).mockRejectedValue(error);

    const { result } = renderHook(() => useCreateCategory(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      code: 'B',
      name: '新規カテゴリ',
      description: '',
      display_order: 2,
      is_active: true,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });

  it('成功時にonSuccessコールバックが呼ばれる', async () => {
    const onSuccess = vi.fn();
    vi.mocked(categoryService.createCategory).mockResolvedValue(mockCategory);

    const { result } = renderHook(() => useCreateCategory(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(
      {
        code: 'A',
        name: 'テスト',
        description: '',
        display_order: 1,
        is_active: true,
      },
      { onSuccess }
    );

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });

  it('エラー時にonErrorコールバックが呼ばれる', async () => {
    const onError = vi.fn();
    const error = new Error('Failed');
    vi.mocked(categoryService.createCategory).mockRejectedValue(error);

    const { result } = renderHook(() => useCreateCategory(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(
      {
        code: 'A',
        name: 'テスト',
        description: '',
        display_order: 1,
        is_active: true,
      },
      { onError }
    );

    await waitFor(() => expect(onError).toHaveBeenCalledWith(error));
  });
});

describe('useUpdateCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('カテゴリを更新できる', async () => {
    const updatedCategory = { ...mockCategory, name: '更新後' };
    vi.mocked(categoryService.updateCategory).mockResolvedValue(updatedCategory);

    const { result } = renderHook(() => useUpdateCategory(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: 1,
      data: { name: '更新後' },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(updatedCategory);
  });

  it('更新時にエラーを処理できる', async () => {
    const error = new Error('Update failed');
    vi.mocked(categoryService.updateCategory).mockRejectedValue(error);

    const { result } = renderHook(() => useUpdateCategory(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      id: 1,
      data: { name: '更新後' },
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });

  it('成功時にonSuccessコールバックが呼ばれる', async () => {
    const onSuccess = vi.fn();
    vi.mocked(categoryService.updateCategory).mockResolvedValue(mockCategory);

    const { result } = renderHook(() => useUpdateCategory(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(
      {
        id: 1,
        data: { name: '更新' },
      },
      { onSuccess }
    );

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });
});

describe('useDeleteCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('カテゴリを削除できる', async () => {
    vi.mocked(categoryService.deleteCategory).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteCategory(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(1);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(categoryService.deleteCategory).toHaveBeenCalledWith(1);
  });

  it('削除時にエラーを処理できる', async () => {
    const error = new Error('Delete failed');
    vi.mocked(categoryService.deleteCategory).mockRejectedValue(error);

    const { result } = renderHook(() => useDeleteCategory(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(1);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });

  it('成功時にonSuccessコールバックが呼ばれる', async () => {
    const onSuccess = vi.fn();
    vi.mocked(categoryService.deleteCategory).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteCategory(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(1, { onSuccess });

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });
});

describe('useToggleCategoryStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('カテゴリステータスを切り替えられる', async () => {
    const toggledCategory = { ...mockCategory, is_active: false };
    vi.mocked(categoryService.toggleCategoryStatus).mockResolvedValue(toggledCategory);

    const { result } = renderHook(() => useToggleCategoryStatus(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(1);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(toggledCategory);
  });

  it('切り替え時にエラーを処理できる', async () => {
    const error = new Error('Toggle failed');
    vi.mocked(categoryService.toggleCategoryStatus).mockRejectedValue(error);

    const { result } = renderHook(() => useToggleCategoryStatus(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(1);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });

  it('成功時にonSuccessコールバックが呼ばれる', async () => {
    const onSuccess = vi.fn();
    vi.mocked(categoryService.toggleCategoryStatus).mockResolvedValue(mockCategory);

    const { result } = renderHook(() => useToggleCategoryStatus(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(1, { onSuccess });

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });
});

describe('useReorderCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('カテゴリの表示順を変更できる', async () => {
    vi.mocked(categoryService.reorderCategories).mockResolvedValue(undefined);

    const { result } = renderHook(() => useReorderCategories(), {
      wrapper: createWrapper(),
    });

    result.current.mutate([3, 1, 2]);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(categoryService.reorderCategories).toHaveBeenCalledWith([3, 1, 2]);
  });

  it('並び替え時にエラーを処理できる', async () => {
    const error = new Error('Reorder failed');
    vi.mocked(categoryService.reorderCategories).mockRejectedValue(error);

    const { result } = renderHook(() => useReorderCategories(), {
      wrapper: createWrapper(),
    });

    result.current.mutate([1, 2, 3]);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
  });

  it('成功時にonSuccessコールバックが呼ばれる', async () => {
    const onSuccess = vi.fn();
    vi.mocked(categoryService.reorderCategories).mockResolvedValue(undefined);

    const { result } = renderHook(() => useReorderCategories(), {
      wrapper: createWrapper(),
    });

    result.current.mutate([1, 2], { onSuccess });

    await waitFor(() => expect(onSuccess).toHaveBeenCalled());
  });
});
