import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin';
import { Card, Button, Input, Modal, Alert, Loading } from '@/components/ui';
import { FormField, ValidationMessage } from '@/components/forms';
import { questionService } from '@/api/services/questionService';
import type { QuestionResponse, CreateQuestionDto, QuestionQuery } from '@/types/question';

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

const CATEGORIES = {
  engagement: 'エンゲージメント',
  satisfaction: '満足度',
  leadership: 'リーダーシップ',
  culture: '企業文化',
  growth: '成長機会',
  worklife: 'ワークライフバランス',
  communication: 'コミュニケーション',
  other: 'その他',
} as const;

interface QuestionFormData {
  question: string;
  type: keyof typeof QUESTION_TYPES;
  category: keyof typeof CATEGORIES;
  is_required: boolean;
  options: string[];
  min_value?: number;
  max_value?: number;
  min_label?: string;
  max_label?: string;
}

export function QuestionManagement(): JSX.Element {
  const [questions, setQuestions] = useState<QuestionResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionResponse | null>(null);
  const [formData, setFormData] = useState<QuestionFormData>({
    question: '',
    type: 'text',
    category: 'other',
    is_required: false,
    options: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const pageSize = 10;

  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const query: QuestionQuery = {
        page: currentPage,
        pageSize,
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter && { category: categoryFilter as any }),
        ...(typeFilter && { type: typeFilter as any }),
      };

      const response = await questionService.getQuestions(query);
      setQuestions(response.data.data);
      setTotalCount(response.data.total);
    } catch (err) {
      console.error('Failed to fetch questions:', err);
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
      category: 'other',
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
        ...(formData.options.length > 0 && { options: formData.options.filter(opt => opt.trim()) }),
        ...(formData.min_value !== undefined && { min_value: formData.min_value }),
        ...(formData.max_value !== undefined && { max_value: formData.max_value }),
        ...(formData.min_label && { min_label: formData.min_label }),
        ...(formData.max_label && { max_label: formData.max_label }),
      };

      if (editingQuestion) {
        await questionService.updateQuestion(editingQuestion.id, submitData);
      } else {
        await questionService.createQuestion(submitData);
      }
      
      setShowModal(false);
      fetchQuestions();
    } catch (err) {
      console.error('Failed to save question:', err);
      setErrors({ general: '保存に失敗しました' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('この質問を削除しますか？削除した質問は復元できません。')) {
      return;
    }

    setLoading(true);
    try {
      await questionService.deleteQuestion(id);
      fetchQuestions();
    } catch (err) {
      console.error('Failed to delete question:', err);
      setError('削除に失敗しました');
    } finally {
      setLoading(false);
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

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setTypeFilter('');
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">質問管理</h1>
            <p className="text-sm text-gray-600">
              調査で使用する質問の作成・編集・削除を行います
            </p>
          </div>
          
          <Button variant="primary" size="md" onClick={openCreateModal}>
            新しい質問を作成
          </Button>
        </div>

        {/* Search and Filters */}
        <Card variant="default" padding="md">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
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
                onClick={clearFilters}
              >
                クリア
              </Button>
            </div>
          </div>
          
          {/* Results summary */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              {totalCount}件の質問が見つかりました
              {(searchTerm || categoryFilter || typeFilter) && (
                <span className="ml-2 text-blue-600">
                  (フィルター適用中)
                </span>
              )}
            </p>
          </div>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert variant="danger" title="エラー">
            {error}
          </Alert>
        )}

        {/* Questions List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loading size="lg" />
          </div>
        ) : (
          <>
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
                      
                      <p className="text-gray-900 mb-2 text-sm">{question.question}</p>
                      
                      {question.options && question.options.length > 0 && (
                        <div className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">選択肢:</span> {question.options.join(', ')}
                        </div>
                      )}
                      
                      {(question.min_value !== null && question.max_value !== null) && (
                        <div className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">範囲:</span> {question.min_value} - {question.max_value}
                          {question.min_label && question.max_label && 
                            ` (${question.min_label} - ${question.max_label})`
                          }
                        </div>
                      )}

                      <div className="text-xs text-gray-500 mt-2">
                        作成日: {new Date(question.created_at).toLocaleDateString('ja-JP')}
                        {question.updated_at !== question.created_at && (
                          <span className="ml-4">
                            更新日: {new Date(question.updated_at).toLocaleDateString('ja-JP')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
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
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-6">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  前のページ
                </Button>

                <div className="flex space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 text-sm rounded ${
                        page === currentPage
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  次のページ
                </Button>

                <span className="text-sm text-gray-600 ml-4">
                  {totalPages}ページ中 {currentPage}ページ目
                </span>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {questions.length === 0 && !loading && (
          <Card variant="default" padding="lg">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">❓</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || categoryFilter || typeFilter ? '条件に一致する質問が見つかりません' : '質問がありません'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || categoryFilter || typeFilter 
                  ? 'フィルター条件を変更するか、新しい質問を作成してください。'
                  : '新しい質問を作成して、質問バンクを構築しましょう。'
                }
              </p>
              <div className="space-x-4">
                {(searchTerm || categoryFilter || typeFilter) && (
                  <Button variant="secondary" size="md" onClick={clearFilters}>
                    フィルターをクリア
                  </Button>
                )}
                <Button variant="primary" size="md" onClick={openCreateModal}>
                  新しい質問を作成
                </Button>
              </div>
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
                  選択肢 <span className="text-red-500">*</span>
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
                      {formData.options.length > 2 && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => removeOption(index)}
                        >
                          削除
                        </Button>
                      )}
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
    </AdminLayout>
  );
}