import React from 'react';
import Modal from '../ui/Modal';
import { Card } from '../ui';

interface SurveyPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  survey: {
    id: number;
    title: string;
    description?: string;
    start_date: string;
    end_date: string;
    is_anonymous: boolean;
  };
  assignedQuestions: Array<{
    id: number;
    text: string;
    type: string;
    category_id: number;
    category_name?: string;
    options?: string[];
    order_num: number;
    is_required: boolean;
  }>;
}

export const SurveyPreviewModal: React.FC<SurveyPreviewModalProps> = ({
  isOpen,
  onClose,
  survey,
  assignedQuestions,
}) => {
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="調査プレビュー"
      size="xl"
      showCloseButton={true}
      closeOnOverlayClick={true}
      closeOnEscape={true}
    >
      <div className="space-y-6">
        {/* 調査メタデータ */}
        <Card variant="default" padding="lg">
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {survey.title}
              </h1>

              {survey.description && (
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  {survey.description}
                </p>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-900">実施期間:</span>
                  <div className="text-blue-700">
                    {formatDate(survey.start_date)} - {formatDate(survey.end_date)}
                  </div>
                </div>

                <div>
                  <span className="font-medium text-blue-900">回答方法:</span>
                  <div className="text-blue-700">
                    {survey.is_anonymous ? '完全匿名' : '記名式'}
                  </div>
                </div>
              </div>
            </div>

            {survey.is_anonymous && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-green-600 text-lg">🔒</span>
                  <div className="text-sm text-green-800">
                    <div className="font-medium">匿名回答を保証</div>
                    <div>個人を特定する情報は一切記録されません</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* 質問リスト */}
        <div className="space-y-4">
          {assignedQuestions
            .sort((a, b) => a.order_num - b.order_num)
            .map((question, index) => (
              <Card key={question.id} variant="default" padding="md">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg font-semibold text-gray-700">
                          Q{index + 1}
                        </span>
                        {question.category_name && (
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                            {question.category_name}
                          </span>
                        )}
                        {question.is_required && (
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                            必須
                          </span>
                        )}
                      </div>
                      <p className="text-base text-gray-900">{question.text}</p>
                    </div>
                  </div>

                  {/* 質問タイプ別の表示は次のタスクで実装 */}
                  <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
                    <p className="text-sm text-gray-500">
                      回答欄（{question.type}）
                    </p>
                  </div>
                </div>
              </Card>
            ))}
        </div>
      </div>
    </Modal>
  );
};
