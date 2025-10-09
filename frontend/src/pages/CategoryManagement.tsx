import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { CategoryTable } from '@/components/admin/CategoryTable';
import { CategoryFormModal } from '@/components/admin/CategoryFormModal';
import { CategoryDeleteDialog } from '@/components/admin/CategoryDeleteDialog';
import { CategoryDetailPanel } from '@/components/admin/CategoryDetailPanel';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, useToggleCategoryStatus, useReorderCategories } from '@/hooks/useCategories';
import { useToast } from '@/contexts/ToastContext';
import { getErrorMessage } from '@/utils/errorHandler';
import type { CategoryWithQuestionCount } from '@/types/category';
import type { CreateCategoryInput, UpdateCategoryInput } from '@/schemas/category.schema';

export function CategoryManagement() {
  const { showToast } = useToast();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(true);
  const [selectedCategory, setSelectedCategory] = useState<CategoryWithQuestionCount | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryWithQuestionCount | null>(null);

  // Queries and Mutations
  const { data: categories = [], isLoading, error } = useCategories(activeFilter);
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();
  const toggleMutation = useToggleCategoryStatus();
  const reorderMutation = useReorderCategories();

  // Filtered categories
  const filteredCategories = categories.filter(category => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      category.code.toLowerCase().includes(query) ||
      category.name.toLowerCase().includes(query) ||
      (category.description && category.description.toLowerCase().includes(query))
    );
  });

  // Handlers
  const handleCreateClick = () => {
    setSelectedCategory(null);
    setIsFormModalOpen(true);
  };

  const handleEditClick = (category: CategoryWithQuestionCount) => {
    setSelectedCategory(category);
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = (category: CategoryWithQuestionCount) => {
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  };

  const handleDetailClick = (category: CategoryWithQuestionCount) => {
    setSelectedCategory(category);
    setIsDetailPanelOpen(true);
  };

  const handleFormSubmit = async (data: CreateCategoryInput | UpdateCategoryInput) => {
    try {
      if (selectedCategory) {
        // Update
        await updateMutation.mutateAsync({
          id: selectedCategory.id,
          data: data as UpdateCategoryInput,
        });
        showToast('カテゴリを更新しました', 'success');
      } else {
        // Create
        await createMutation.mutateAsync(data as CreateCategoryInput);
        showToast('カテゴリを作成しました', 'success');
      }
      setIsFormModalOpen(false);
      setSelectedCategory(null);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      showToast(errorMessage, 'danger');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteMutation.mutateAsync(categoryToDelete.id);
      showToast('カテゴリを削除しました', 'success');
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      showToast(errorMessage, 'danger');
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await toggleMutation.mutateAsync(id);
      showToast('カテゴリステータスを変更しました', 'success');
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      showToast(errorMessage, 'danger');
    }
  };

  const handleReorder = async (orderedIds: number[]) => {
    try {
      await reorderMutation.mutateAsync(orderedIds);
      showToast('カテゴリの並び順を変更しました', 'success');
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      showToast(errorMessage, 'danger');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">カテゴリ管理</h1>
            <p className="mt-1 text-sm text-gray-600">
              質問カテゴリの作成、編集、並び替えができます
            </p>
          </div>
          <button
            onClick={handleCreateClick}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            新規カテゴリ作成
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="カテゴリコード、名称、説明で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveFilter(undefined)}
              className={`px-4 py-2 rounded-md ${
                activeFilter === undefined
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              全て
            </button>
            <button
              onClick={() => setActiveFilter(true)}
              className={`px-4 py-2 rounded-md ${
                activeFilter === true
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              有効のみ
            </button>
            <button
              onClick={() => setActiveFilter(false)}
              className={`px-4 py-2 rounded-md ${
                activeFilter === false
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              無効のみ
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800">
              カテゴリの読み込みに失敗しました: {getErrorMessage(error)}
            </p>
          </div>
        )}

        {/* Table */}
        <CategoryTable
          categories={filteredCategories}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          onDetail={handleDetailClick}
          onToggleStatus={handleToggleStatus}
          onReorder={handleReorder}
          isLoading={isLoading}
        />

        {/* Modals */}
        <CategoryFormModal
          isOpen={isFormModalOpen}
          category={selectedCategory}
          onClose={() => {
            setIsFormModalOpen(false);
            setSelectedCategory(null);
          }}
          onSubmit={handleFormSubmit}
        />

        <CategoryDeleteDialog
          isOpen={isDeleteDialogOpen}
          category={categoryToDelete}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setCategoryToDelete(null);
          }}
          onConfirm={handleDeleteConfirm}
        />

        <CategoryDetailPanel
          isOpen={isDetailPanelOpen}
          category={selectedCategory}
          onClose={() => {
            setIsDetailPanelOpen(false);
            setSelectedCategory(null);
          }}
        />
      </div>
    </AdminLayout>
  );
}
