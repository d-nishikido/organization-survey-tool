import React, { useState } from 'react';
import Modal from '../ui/Modal';
import type { CategoryWithQuestionCount } from '@/types/category';

interface CategoryDeleteDialogProps {
  isOpen: boolean;
  category: CategoryWithQuestionCount | null;
  onClose: () => void;
  onConfirm: (categoryId: number) => Promise<void>;
}

export const CategoryDeleteDialog: React.FC<CategoryDeleteDialogProps> = ({
  isOpen,
  category,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!category) return null;

  const hasRelatedQuestions = category.question_count > 0;

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      await onConfirm(category.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete category:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="カテゴリの削除"
      size="md"
    >
      <div role="dialog">
        {/* カテゴリ情報 */}
        <div className="mb-4">
          <div className="text-sm text-gray-500 mb-2">削除対象</div>
          <div className="bg-gray-50 p-3 rounded-md">
            <div className="flex items-start gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                {category.code}
              </span>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{category.name}</div>
                {category.description && (
                  <div className="text-sm text-gray-600 mt-1">{category.description}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 警告メッセージ */}
        {hasRelatedQuestions ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-yellow-400 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
                role="img"
                aria-label="警告"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  このカテゴリには{category.question_count}件の質問が関連しています
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>削除すると質問のカテゴリ参照がNULLになります。</p>
                  <p className="mt-1">本当に削除してもよろしいですか？</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <p className="text-sm text-gray-700">
              このカテゴリを削除してもよろしいですか？
            </p>
            <p className="text-sm text-gray-500 mt-1">この操作は取り消せません。</p>
          </div>
        )}

        {/* アクションボタン */}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? '削除中...' : '削除'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
