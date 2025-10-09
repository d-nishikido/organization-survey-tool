import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Modal from '../ui/Modal';
import {
  createCategorySchema,
  updateCategorySchema,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from '@/schemas/category.schema';
import type { CategoryWithQuestionCount } from '@/types/category';

interface CategoryFormModalProps {
  isOpen: boolean;
  category: CategoryWithQuestionCount | null;
  onClose: () => void;
  onSubmit: (data: CreateCategoryInput | UpdateCategoryInput) => Promise<void>;
}

type CategoryFormData = {
  code: string;
  name: string;
  description: string;
  display_order: number;
  is_active: boolean;
};

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  category,
  onClose,
  onSubmit,
}) => {
  const isEditMode = category !== null;
  const schema = isEditMode ? updateCategorySchema : createCategorySchema;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: category?.code || '',
      name: category?.name || '',
      description: category?.description || '',
      display_order: category?.display_order || 1,
      is_active: category?.is_active ?? true,
    },
  });

  // モーダルが開くたびにフォームをリセット
  useEffect(() => {
    if (isOpen) {
      reset({
        code: category?.code || '',
        name: category?.name || '',
        description: category?.description || '',
        display_order: category?.display_order || 1,
        is_active: category?.is_active ?? true,
      });
    }
  }, [isOpen, category, reset]);

  const handleFormSubmit = async (data: CategoryFormData) => {
    try {
      if (isEditMode) {
        // 編集モード: codeを除外
        const { code, ...updateData } = data;
        await onSubmit(updateData);
      } else {
        // 作成モード: 全データを送信
        await onSubmit(data);
      }
      onClose();
    } catch (error) {
      // エラーは親コンポーネントで処理されるため、ここではモーダルを閉じない
      console.error('Form submission error:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'カテゴリ編集' : 'カテゴリ新規作成'}
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} role="dialog">
        <div className="space-y-4">
          {/* カテゴリコード */}
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700">
              カテゴリコード <span className="text-red-500">*</span>
            </label>
            <input
              id="code"
              type="text"
              disabled={isEditMode}
              {...register('code')}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                errors.code ? 'border-red-500' : ''
              } ${isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="例: A"
            />
            {errors.code && (
              <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
            )}
          </div>

          {/* カテゴリ名 */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              カテゴリ名 <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                errors.name ? 'border-red-500' : ''
              }`}
              placeholder="例: 仕事について"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* 説明 */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              説明
            </label>
            <textarea
              id="description"
              rows={3}
              {...register('description')}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                errors.description ? 'border-red-500' : ''
              }`}
              placeholder="例: 業務内容・負荷・やりがい"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* 表示順序 */}
          <div>
            <label htmlFor="display_order" className="block text-sm font-medium text-gray-700">
              表示順序 <span className="text-red-500">*</span>
            </label>
            <input
              id="display_order"
              type="number"
              {...register('display_order', { valueAsNumber: true })}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                errors.display_order ? 'border-red-500' : ''
              }`}
              placeholder="例: 1"
            />
            {errors.display_order && (
              <p className="mt-1 text-sm text-red-600">{errors.display_order.message}</p>
            )}
          </div>

          {/* 有効/無効 */}
          <div className="flex items-center">
            <input
              id="is_active"
              type="checkbox"
              {...register('is_active')}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
              有効
            </label>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '送信中...' : isEditMode ? '更新' : '作成'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
