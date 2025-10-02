import { useState, useEffect } from 'react';
import { Card, Button, Input, Modal, Alert, Loading } from '../ui';
import { FormField, ValidationMessage } from '../forms';
import type { QuestionResponse, CreateQuestionDto, QuestionCategory, QuestionType } from '../../types/question';

const QUESTION_TYPES = {
  text: 'テキスト（短文）',
  textarea: 'テキスト（長文）',
  radio: '単一選択',
  checkbox: '複数選択',
  select: 'プルダウン',
  rating: '評価',
  scale: 'スケール',
  boolean: 'はい/いいえ',
} as const;

// Map database category codes to display labels
const CATEGORIES: Record<QuestionCategory, string> = {
  'A': 'エンゲージメント',
  'B': '満足度',
  'C': 'リーダーシップ',
  'D': '企業文化',
  'E': '成長機会',
  'F': 'ワークライフバランス',
  'G': 'コミュニケーション',
};

interface QuestionFormData {
  question: string;
  type: QuestionType;
  category: QuestionCategory;
  is_required: boolean;
  options: string[];
  min_value?: number;
  max_value?: number;
  min_label?: string;
  max_label?: string;
}

interface QuestionBankProps {
  onQuestionSelect?: (question: QuestionResponse) => void;
  selectionMode?: boolean;
}

export function QuestionBank({ onQuestionSelect, selectionMode = false }: QuestionBankProps): JSX.Element {
  const [questions, setQuestions] = useState<QuestionResponse[]>([]);
  const [, setTotalCount] = useState(0);
  const [currentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionResponse | null>(null);
  const [formData, setFormData] = useState<QuestionFormData>({
    question: '',
    type: 'text',
    category: 'G' as QuestionCategory,
    is_required: false,
    options: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Mock service functions removed to avoid unused variable warnings

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Return empty array for now
      setQuestions([]);
      setTotalCount(0);
    } catch (err) {
      setError('質問の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [currentPage, searchTerm, categoryFilter, typeFilter]);

  const resetForm = () => {
    setFormData({
      question: '',
      type: 'text',
      category: 'G' as QuestionCategory,
      is_required: false,
      options: [],
    });
    setErrors({});
    setEditingQuestion(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (question: QuestionResponse) => {
    setFormData({
      question: question.question,
      type: question.type,
      category: question.category,
      is_required: question.is_required,
      options: question.options || [],
      min_value: question.min_value || undefined,
      max_value: question.max_value || undefined,
      min_label: question.min_label || undefined,
      max_label: question.max_label || undefined,
    });
    setEditingQuestion(question);
    setShowModal(true);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.question.trim()) {
      newErrors.question = '質問文は必須です';
    }

    if (['radio', 'checkbox', 'select'].includes(formData.type) && formData.options.length < 2) {
      newErrors.options = '選択肢は2つ以上設定してください';
    }

    if (['rating', 'scale'].includes(formData.type)) {
      if (formData.min_value === undefined || formData.max_value === undefined) {
        newErrors.range = '最小値と最大値を設定してください';
      } else if (formData.max_value <= formData.min_value) {
        newErrors.range = '最大値は最小値より大きく設定してください';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    
    try {
      const submitData: CreateQuestionDto = {
        question: formData.question.trim(),
        type: formData.type,
        category: formData.category,
        is_required: formData.is_required,
        ...(formData.options.length > 0 && { options: formData.options }),
        ...(formData.min_value !== undefined && { min_value: formData.min_value }),
        ...(formData.max_value !== undefined && { max_value: formData.max_value }),
        ...(formData.min_label && { min_label: formData.min_label }),
        ...(formData.max_label && { max_label: formData.max_label }),
      };

      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Question data:', submitData);
      
      setShowModal(false);
      fetchQuestions();
    } catch (err) {
      setErrors({ general: '保存に失敗しました' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (_id: number) => {
    if (window.confirm('この質問を削除しますか？')) {
      setLoading(true);
      try {
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('Deleting question:', id);
        fetchQuestions();
      } catch (err) {
        setError('削除に失敗しました');
      } finally {
        setLoading(false);
      }
    }
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, ''],
    }));
  };

  const updateOption = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt),
    }));
  };

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">質問バンク</h2>
          <p className="text-sm text-gray-600">
            {selectionMode ? '調査に追加する質問を選択してください' : '質問の作成・管理を行います'}
          </p>
        </div>
        
        {!selectionMode && (
          <Button variant="primary" size="md" onClick={openCreateModal}>
            新しい質問を作成
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card variant="default" padding="md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Input
              type="text"
              placeholder="質問を検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">すべてのカテゴリ</option>
              {Object.entries(CATEGORIES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">すべてのタイプ</option>
              {Object.entries(QUESTION_TYPES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('');
                setTypeFilter('');
              }}
            >
              クリア
            </Button>
          </div>
        </div>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="danger" title="エラー">
          質問の取得に失敗しました。
        </Alert>
      )}

      {/* Questions List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loading size="lg" />
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((question) => (
            <Card key={question.id} variant="default" padding="md">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                      {CATEGORIES[question.category]}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
                      {QUESTION_TYPES[question.type]}
                    </span>
                    {question.is_required && (
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                        必須
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-900 mb-2">{question.question}</p>
                  
                  {question.options && question.options.length > 0 && (
                    <div className="text-sm text-gray-600">
                      選択肢: {question.options.join(', ')}
                    </div>
                  )}
                  
                  {(question.min_value !== null && question.max_value !== null) && (
                    <div className="text-sm text-gray-600">
                      範囲: {question.min_value} - {question.max_value}
                      {question.min_label && question.max_label && 
                        ` (${question.min_label} - ${question.max_label})`
                      }
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {selectionMode && onQuestionSelect ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onQuestionSelect(question)}
                    >
                      選択
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openEditModal(question)}
                      >
                        編集
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(question.id)}
                      >
                        削除
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {questions.length === 0 && !loading && (
        <Card variant="default" padding="lg">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">❓</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              質問がありません
            </h3>
            <p className="text-gray-600 mb-6">
              新しい質問を作成して、質問バンクを構築しましょう。
            </p>
            {!selectionMode && (
              <Button variant="primary" size="md" onClick={openCreateModal}>
                最初の質問を作成
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Question Form Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingQuestion ? '質問を編集' : '新しい質問を作成'}
        size="lg"
      >
        <div className="space-y-4">
          <FormField label="質問文" isRequired>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              value={formData.question}
              onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
              placeholder="質問を入力してください"
            />
            {errors.question && <ValidationMessage type="error" message={errors.question} />}
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="カテゴリ" isRequired>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
              >
                {Object.entries(CATEGORIES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </FormField>

            <FormField label="質問タイプ" isRequired>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
              >
                {Object.entries(QUESTION_TYPES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </FormField>
          </div>

          {/* Options for choice questions */}
          {['radio', 'checkbox', 'select'].includes(formData.type) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                選択肢
              </label>
              <div className="space-y-2">
                {formData.options.map((option, index) => (
                  <div key={index} className="flex space-x-2">
                    <Input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`選択肢 ${index + 1}`}
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => removeOption(index)}
                    >
                      削除
                    </Button>
                  </div>
                ))}
                <Button variant="secondary" size="sm" onClick={addOption}>
                  選択肢を追加
                </Button>
              </div>
              {errors.options && <ValidationMessage type="error" message={errors.options} />}
            </div>
          )}

          {/* Range for rating/scale questions */}
          {['rating', 'scale'].includes(formData.type) && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="最小値" isRequired>
                  <Input
                    type="number"
                    value={formData.min_value || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, min_value: parseInt(e.target.value) || undefined }))}
                  />
                </FormField>
                <FormField label="最大値" isRequired>
                  <Input
                    type="number"
                    value={formData.max_value || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_value: parseInt(e.target.value) || undefined }))}
                  />
                </FormField>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField label="最小値ラベル">
                  <Input
                    type="text"
                    value={formData.min_label || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, min_label: e.target.value }))}
                    placeholder="例: 全く思わない"
                  />
                </FormField>
                <FormField label="最大値ラベル">
                  <Input
                    type="text"
                    value={formData.max_label || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, max_label: e.target.value }))}
                    placeholder="例: 強く思う"
                  />
                </FormField>
              </div>
              {errors.range && <ValidationMessage type="error" message={errors.range} />}
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_required"
              checked={formData.is_required}
              onChange={(e) => setFormData(prev => ({ ...prev, is_required: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_required" className="ml-2 block text-sm text-gray-900">
              必須回答
            </label>
          </div>

          {errors.general && <ValidationMessage type="error" message={errors.general} />}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowModal(false)}
              disabled={saving}
            >
              キャンセル
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? '保存中...' : (editingQuestion ? '更新' : '作成')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}