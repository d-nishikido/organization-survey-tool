import React from 'react';
import Modal from '../ui/Modal';
import type { CategoryWithQuestionCount } from '@/types/category';

interface CategoryDetailPanelProps {
  isOpen: boolean;
  category: CategoryWithQuestionCount | null;
  onClose: () => void;
}

export const CategoryDetailPanel: React.FC<CategoryDetailPanelProps> = ({
  isOpen,
  category,
  onClose,
}) => {
  if (!category) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="カテゴリ詳細"
      size="lg"
    >
      <div role="dialog">
        {/* カテゴリ基本情報 */}
        <div className="space-y-4">
          {/* コードとステータス */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-blue-100 text-blue-800">
              {category.code}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                category.is_active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {category.is_active ? '有効' : '無効'}
            </span>
          </div>

          {/* カテゴリ名 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>
            {category.description && (
              <p className="mt-1 text-sm text-gray-600">{category.description}</p>
            )}
          </div>

          {/* 詳細情報グリッド */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* 表示順序 */}
              <div>
                <dt className="text-sm font-medium text-gray-500">表示順序</dt>
                <dd className="mt-1 text-sm text-gray-900">{category.display_order}</dd>
              </div>

              {/* 関連質問数 */}
              <div>
                <dt className="text-sm font-medium text-gray-500">関連質問数</dt>
                <dd className="mt-1 text-sm text-gray-900">{category.question_count}件</dd>
              </div>

              {/* 作成日時 */}
              <div>
                <dt className="text-sm font-medium text-gray-500">作成日時</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(category.created_at)}
                </dd>
              </div>

              {/* 最終更新日時 */}
              <div>
                <dt className="text-sm font-medium text-gray-500">最終更新日時</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {formatDate(category.updated_at)}
                </dd>
              </div>
            </dl>
          </div>

          {/* 関連質問情報 */}
          {category.question_count === 0 && (
            <div className="bg-gray-50 rounded-md p-4 mt-4">
              <p className="text-sm text-gray-600 text-center">
                このカテゴリには関連する質問がありません
              </p>
            </div>
          )}
        </div>

        {/* 閉じるボタン */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            閉じる
          </button>
        </div>
      </div>
    </Modal>
  );
};
