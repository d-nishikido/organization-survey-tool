import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin';
import { Card, Button, Input, Alert, Loading } from '@/components/ui';
import { SurveyQuestionService } from '@/api/services/surveyQuestionService';
import type { SurveyQuestion, SurveyQuestionsData } from '@/api/services/surveyQuestionService';
import { categoryService } from '@/api/services/categoryService';
import type { CategoryWithQuestionCount } from '@/types/category';
import { SurveyPreviewModal } from '@/components/admin/SurveyPreviewModal';
import axios from 'axios';

const QUESTION_TYPES = {
  text: 'テキスト（短文）',
  textarea: 'テキスト（長文）',
  multiple_choice: '単一選択',
  checkbox: '複数選択',
  select: 'プルダウン',
  rating: '評価',
  rating_5: '評価（5段階）',
  rating_10: '評価（10段階）',
  scale: 'スケール',
  yes_no: 'はい/いいえ',
} as const;


// エラー判別ヘルパー関数
const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      // ネットワークエラー
      return 'ネットワークエラーが発生しました。接続を確認してください。';
    }
    
    const status = error.response.status;
    
    if (status === 404) {
      return '指定された調査または質問が見つかりません。';
    } else if (status === 422) {
      return 'この質問は既に割り当てられています。';
    } else if (status >= 400 && status < 500) {
      return 'リクエストが不正です。再度お試しください。';
    } else if (status >= 500) {
      return 'システムエラーが発生しました。しばらくしてから再度お試しください。';
    }
  }
  
  return '質問の割り当てに失敗しました。再度お試しください。';
};

// 状態管理のための型定義
interface StateSnapshot {
  assignedQuestions: SurveyQuestion[];
  availableQuestions: SurveyQuestion[];
}

export function SurveyQuestionAssignment(): JSX.Element {
  const { surveyId } = useParams<{ surveyId: string }>();
  const [surveyData, setSurveyData] = useState<SurveyQuestionsData | null>(null);
  const [availableQuestions, setAvailableQuestions] = useState<SurveyQuestion[]>([]);
  const [assignedQuestions, setAssignedQuestions] = useState<SurveyQuestion[]>([]);
  const [categories, setCategories] = useState<CategoryWithQuestionCount[]>([]);

  // プレビューモーダルの開閉状態
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<SurveyQuestion | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    if (surveyId) {
      fetchSurveyQuestions();
    }
  }, [surveyId]);

  useEffect(() => {
    if (surveyData) {
      applyFilters();
    }
  }, [surveyData, searchTerm, categoryFilter, typeFilter]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      // カテゴリの取得失敗は致命的ではないので、エラー表示はしない
    }
  };

  const fetchSurveyQuestions = async () => {
    if (!surveyId) return;

    setLoading(true);
    try {
      const data = await SurveyQuestionService.getSurveyQuestions(surveyId);
      setSurveyData(data);
      setAvailableQuestions(data.availableQuestions);
      setAssignedQuestions(data.assignedQuestions.sort((a, b) => a.order_num - b.order_num));
    } catch (err) {
      console.error('Failed to fetch survey questions:', err);
      setError('調査質問の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 状態管理ヘルパー関数
  const saveStateSnapshot = (): StateSnapshot => ({
    assignedQuestions: [...assignedQuestions],
    availableQuestions: [...availableQuestions],
  });

  const restoreStateSnapshot = (snapshot: StateSnapshot): void => {
    setAssignedQuestions(snapshot.assignedQuestions);
    setAvailableQuestions(snapshot.availableQuestions);
  };

  // カテゴリIDからカテゴリ名を取得
  const getCategoryName = (categoryId: number): string => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || 'その他';
  };

  const applyFilters = () => {
    if (!surveyData) return;

    let filtered = [...surveyData.availableQuestions];

    if (searchTerm) {
      filtered = filtered.filter(q =>
        q.text.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(q => q.category_id.toString() === categoryFilter);
    }

    if (typeFilter) {
      filtered = filtered.filter(q => q.type === typeFilter);
    }

    setAvailableQuestions(filtered);
  };

  const handleDragStart = (e: React.DragEvent, question: SurveyQuestion) => {
    setDraggedItem(question);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index?: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (index !== undefined) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDropToAssigned = async (e: React.DragEvent, insertIndex?: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    
    if (!draggedItem || !surveyId) return;

    // 状態スナップショットを保存（ロールバック用）
    const snapshot = saveStateSnapshot();

    try {
      setSaving(true);
      
      const isReordering = assignedQuestions.some(q => q.id === draggedItem.id);

      if (isReordering) {
        // 既存の割り当て済み質問の順序変更
        const newAssigned = [...assignedQuestions];
        const dragIndex = newAssigned.findIndex(q => q.id === draggedItem.id);
        const [removed] = newAssigned.splice(dragIndex, 1);

        const targetIndex = insertIndex !== undefined ? insertIndex : newAssigned.length;
        newAssigned.splice(targetIndex, 0, removed);

        // 順序番号を更新（楽観的UI）
        const reordered = newAssigned.map((q, index) => ({ ...q, order_num: index + 1 }));
        setAssignedQuestions(reordered);

        // バックエンドに保存
        await saveQuestionOrder(reordered);
      } else {
        // 新規質問の割り当て
        const newAssigned = [...assignedQuestions];

        // 指定位置に挿入し、順序番号を更新
        const insertPosition = insertIndex !== undefined ? insertIndex : newAssigned.length;
        const questionWithOrder = { ...draggedItem, order_num: insertPosition + 1 };
        newAssigned.splice(insertPosition, 0, questionWithOrder);

        const reordered = newAssigned.map((q, index) => ({ ...q, order_num: index + 1 }));
        
        // 楽観的UI更新
        setAssignedQuestions(reordered);
        setAvailableQuestions(prev => prev.filter(q => q.id !== draggedItem.id));

        // バックエンドに保存
        await assignQuestionToSurvey(reordered);
      }
    } catch (err) {
      console.error('Failed to handle drop:', err);
      
      // エラー時は状態をロールバック
      restoreStateSnapshot(snapshot);
      
      // 具体的なエラーメッセージを表示
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
    } finally {
      setSaving(false);
      setDraggedItem(null);
    }
  };;

  const handleDropToAvailable = async (e: React.DragEvent) => {
    e.preventDefault();

    if (!draggedItem || !assignedQuestions.some(q => q.id === draggedItem.id)) return;

    // 状態スナップショットを保存（ロールバック用）
    const snapshot = saveStateSnapshot();

    try {
      setSaving(true);

      // 割り当て済みリストから削除
      const newAssigned = assignedQuestions.filter(q => q.id !== draggedItem.id);
      const reordered = newAssigned.map((q, index) => ({ ...q, order_num: index + 1 }));
      
      // 楽観的UI更新
      setAssignedQuestions(reordered);

      // 利用可能リストに追加
      const { order_num, ...questionWithoutOrder } = draggedItem;
      setAvailableQuestions(prev => [questionWithoutOrder, ...prev]);

      // バックエンドに更新を保存
      await assignQuestionToSurvey(reordered);
    } catch (err) {
      console.error('Failed to unassign question:', err);
      
      // エラー時は状態をロールバック
      restoreStateSnapshot(snapshot);
      
      // 具体的なエラーメッセージを表示
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
    } finally {
      setSaving(false);
      setDraggedItem(null);
    }
  };;

  const assignQuestionToSurvey = async (questions: SurveyQuestion[]) => {
    if (!surveyId) return;

    const questionIds = questions.map(q => q.id);
    await SurveyQuestionService.assignQuestions(surveyId, questionIds);
  };

  const saveQuestionOrder = async (questions: SurveyQuestion[]) => {
    if (!surveyId) return;

    const questionIds = questions.map(q => q.id);
    await SurveyQuestionService.updateQuestionOrder(surveyId, questionIds);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setTypeFilter('');
  };

  // プレビュー機能のハンドラー
  const handleShowPreview = (): void => {
    setIsPreviewOpen(true);
  };

  const handleClosePreview = (): void => {
    setIsPreviewOpen(false);
  };

  const canPreview = (): boolean => {
    return assignedQuestions.length > 0;
  };

  if (!surveyId) {
    return (
      <AdminLayout>
        <Alert variant="danger" title="エラー">
          調査IDが指定されていません
        </Alert>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">質問割り当て</h1>
            {surveyData && (
              <p className="text-sm text-gray-600">
                調査「{surveyData.surveyTitle}」に質問を割り当て、順序を設定します
              </p>
            )}
          </div>

          {/* プレビューボタン */}
          <Button
            variant="secondary"
            size="md"
            onClick={handleShowPreview}
            disabled={!canPreview()}
            title={!canPreview() ? '質問を割り当ててください' : ''}
          >
            📋 プレビュー
          </Button>
        </div>

        {error && (
          <Alert variant="danger" title="エラー">
            {error}
          </Alert>
        )}

        {saving && (
          <Alert variant="info" title="保存中">
            変更を保存しています...
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Questions */}
          <div className="space-y-4">
            <Card variant="default" padding="md">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">利用可能な質問</h2>
              
              {/* Filters */}
              <div className="space-y-3 mb-4">
                <Input
                  type="text"
                  placeholder="質問を検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                
                <div className="grid grid-cols-2 gap-3">
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="">すべてのカテゴリ</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id.toString()}>{category.name}</option>
                    ))}
                  </select>

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

                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  フィルタークリア
                </Button>
              </div>

              {/* Questions List */}
              <div
                className="min-h-[400px] border-2 border-dashed border-gray-300 rounded-lg p-4"
                onDragOver={handleDragOver}
                onDrop={handleDropToAvailable}
                onDragLeave={handleDragLeave}
              >
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loading size="md" />
                  </div>
                ) : availableQuestions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📝</div>
                    <p>利用可能な質問がありません</p>
                    {(searchTerm || categoryFilter || typeFilter) && (
                      <p className="text-sm mt-1">フィルター条件を変更してください</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableQuestions.map((question) => (
                      <div
                        key={question.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, question)}
                        className="p-3 bg-white border border-gray-200 rounded-lg cursor-move hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                {getCategoryName(question.category_id)}
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
                            <p className="text-sm text-gray-900">{question.text}</p>
                          </div>
                          <div className="ml-2 text-gray-400">
                            ⋮⋮
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Assigned Questions */}
          <div className="space-y-4">
            <Card variant="default" padding="md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  割り当て済み質問
                </h2>
              </div>

              <div
                className="min-h-[400px] border-2 border-dashed border-blue-200 rounded-lg p-4 bg-blue-50/30"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDropToAssigned(e)}
                onDragLeave={handleDragLeave}
              >
                {assignedQuestions.length === 0 ? (
                  <div className="text-center py-16 text-gray-500">
                    <div className="text-4xl mb-2">➕</div>
                    <p>ここに質問をドラッグしてください</p>
                    <p className="text-sm mt-1">左側から質問を選択して、この領域にドロップします</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {assignedQuestions.map((question, index) => (
                      <div key={question.id} className="relative">
                        {/* Drop zone before this item */}
                        <div
                          className={`h-2 -mb-1 rounded ${dragOverIndex === index ? 'bg-blue-300' : 'transparent'}`}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDrop={(e) => handleDropToAssigned(e, index)}
                        />
                        
                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, question)}
                          className="p-3 bg-white border border-gray-200 rounded-lg cursor-move hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                              {question.order_num}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                  {getCategoryName(question.category_id)}
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
                              <p className="text-sm text-gray-900">{question.text}</p>
                            </div>
                            
                            <div className="ml-2 text-gray-400">
                              ⋮⋮
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Drop zone after last item */}
                    <div
                      className={`h-2 rounded ${dragOverIndex === assignedQuestions.length ? 'bg-blue-300' : 'transparent'}`}
                      onDragOver={(e) => handleDragOver(e, assignedQuestions.length)}
                      onDrop={(e) => handleDropToAssigned(e, assignedQuestions.length)}
                    />
                  </div>
                )}
              </div>

              {assignedQuestions.length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    💡 ヒント: 質問をドラッグして順序を変更できます。
                    左の領域にドラッグすると割り当てを解除できます。
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* プレビューモーダル */}
      {surveyData && (
        <SurveyPreviewModal
          isOpen={isPreviewOpen}
          onClose={handleClosePreview}
          survey={{
            id: parseInt(surveyData.surveyId),
            title: surveyData.surveyTitle,
            description: surveyData.surveyDescription,
            start_date: surveyData.surveyStartDate || new Date().toISOString(),
            end_date: surveyData.surveyEndDate || new Date().toISOString(),
            is_anonymous: surveyData.surveyIsAnonymous ?? true,
          }}
          assignedQuestions={assignedQuestions}
        />
      )}
    </AdminLayout>
  );
}