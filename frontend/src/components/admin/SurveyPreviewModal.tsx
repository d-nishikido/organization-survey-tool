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

  const renderQuestionInput = (question: SurveyPreviewModalProps['assignedQuestions'][0]) => {
    switch (question.type) {
      case 'text':
        return (
          <input
            type="text"
            placeholder="回答を入力してください"
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-500"
          />
        );

      case 'textarea':
        return (
          <textarea
            placeholder="回答を入力してください"
            disabled
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-500"
          />
        );

      case 'radio':
      case 'select':
        if (question.options && question.options.length > 0) {
          return (
            <div className="space-y-2">
              {question.options.map((option, idx) => (
                <label key={idx} className="flex items-center space-x-2 cursor-not-allowed">
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    disabled
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          );
        }
        return (
          <div className="text-sm text-gray-500 italic">
            選択肢が設定されていません
          </div>
        );

      case 'checkbox':
        if (question.options && question.options.length > 0) {
          return (
            <div className="space-y-2">
              {question.options.map((option, idx) => (
                <label key={idx} className="flex items-center space-x-2 cursor-not-allowed">
                  <input
                    type="checkbox"
                    disabled
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          );
        }
        return (
          <div className="text-sm text-gray-500 italic">
            選択肢が設定されていません
          </div>
        );

      case 'scale':
      case 'rating_5':
      case 'rating_10':
        // スケール質問の場合、1-5または1-10のラジオボタンを表示
        const maxValue = question.type === 'rating_10' ? 10 : 5;
        const scaleOptions = Array.from({ length: maxValue }, (_, i) => i + 1);
        
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              {scaleOptions.map((value) => (
                <label
                  key={value}
                  className="flex flex-col items-center space-y-1 cursor-not-allowed"
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    disabled
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">{value}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>低い</span>
              <span>高い</span>
            </div>
          </div>
        );

      case 'boolean':
      case 'yes_no':
        return (
          <div className="space-y-2">
            <label className="flex items-center space-x-2 cursor-not-allowed">
              <input
                type="radio"
                name={`question-${question.id}`}
                disabled
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-700">はい</span>
            </label>
            <label className="flex items-center space-x-2 cursor-not-allowed">
              <input
                type="radio"
                name={`question-${question.id}`}
                disabled
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-700">いいえ</span>
            </label>
          </div>
        );

      default:
        return (
          <div className="p-3 bg-gray-50 rounded border border-gray-200">
            <p className="text-sm text-gray-500">
              回答欄（{question.type}）
            </p>
          </div>
        );
    }
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

                  {/* 質問タイプ別の入力UI */}
                  <div className="mt-4">
                    {renderQuestionInput(question)}
                  </div>
                </div>
              </Card>
            ))}
        </div>
      </div>
    </Modal>
  );
};
