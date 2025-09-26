import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin';
import { Card, Button, Input, Alert, Loading } from '@/components/ui';
import QuestionService from '@/api/services/questionService';
import SurveyService from '@/api/services/surveyService';
import type { QuestionResponse, QuestionQuery } from '@/types/question';
import type { SurveyResponse } from '@/types/survey';

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

interface SurveyQuestion extends QuestionResponse {
  order_index: number;
}

export function SurveyQuestionAssignment(): JSX.Element {
  const { surveyId } = useParams<{ surveyId: string }>();
  const [survey, setSurvey] = useState<SurveyResponse | null>(null);
  const [availableQuestions, setAvailableQuestions] = useState<QuestionResponse[]>([]);
  const [assignedQuestions, setAssignedQuestions] = useState<SurveyQuestion[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<QuestionResponse | SurveyQuestion | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    if (surveyId) {
      fetchSurveyData();
      fetchAvailableQuestions();
      fetchAssignedQuestions();
    }
  }, [surveyId]);

  useEffect(() => {
    fetchAvailableQuestions();
  }, [searchTerm, categoryFilter, typeFilter]);

  const fetchSurveyData = async () => {
    if (!surveyId) return;
    
    try {
      const response = await SurveyService.getSurvey(parseInt(surveyId));
      setSurvey(response.data.data);
    } catch (err) {
      console.error('Failed to fetch survey:', err);
      setError('調査情報の取得に失敗しました');
    }
  };

  const fetchAvailableQuestions = async () => {
    setLoading(true);
    try {
      const query: QuestionQuery = {
        page: 1,
        pageSize: 100, // Get all available questions
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter && { category: categoryFilter as any }),
        ...(typeFilter && { type: typeFilter as any }),
      };

      const response = await QuestionService.getQuestions(query);
      // Filter out already assigned questions
      const assigned = assignedQuestions.map(q => q.id);
      const available = response.data.data.filter(q => !assigned.includes(q.id));
      setAvailableQuestions(available);
    } catch (err) {
      console.error('Failed to fetch available questions:', err);
      setError('利用可能な質問の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedQuestions = async () => {
    if (!surveyId) return;
    
    try {
      const response = await SurveyService.getSurveyQuestions(parseInt(surveyId));
      // Add order_index to each question
      const questionsWithOrder: SurveyQuestion[] = response.data.data.map((q: any, index: number) => ({
        ...q,
        order_index: q.order_index || index + 1
      }));
      // Sort by order_index
      questionsWithOrder.sort((a, b) => a.order_index - b.order_index);
      setAssignedQuestions(questionsWithOrder);
    } catch (err) {
      console.error('Failed to fetch assigned questions:', err);
      setError('割り当て済み質問の取得に失敗しました');
    }
  };

  const handleDragStart = (e: React.DragEvent, question: QuestionResponse | SurveyQuestion) => {
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

    try {
      setSaving(true);
      
      if ('order_index' in draggedItem) {
        // Reordering existing assigned question
        const newAssigned = [...assignedQuestions];
        const dragIndex = newAssigned.findIndex(q => q.id === draggedItem.id);
        const [removed] = newAssigned.splice(dragIndex, 1);
        
        const targetIndex = insertIndex !== undefined ? insertIndex : newAssigned.length;
        newAssigned.splice(targetIndex, 0, removed);
        
        // Update order indices
        const reordered = newAssigned.map((q, index) => ({ ...q, order_index: index + 1 }));
        setAssignedQuestions(reordered);
        
        // Save to backend
        await saveQuestionOrder(reordered);
      } else {
        // Assigning new question
        const newOrder = insertIndex !== undefined ? insertIndex + 1 : assignedQuestions.length + 1;
        const newAssigned = [...assignedQuestions];
        
        // Insert at position and update order indices
        const insertPosition = insertIndex !== undefined ? insertIndex : newAssigned.length;
        newAssigned.splice(insertPosition, 0, { ...draggedItem, order_index: newOrder });
        
        const reordered = newAssigned.map((q, index) => ({ ...q, order_index: index + 1 }));
        setAssignedQuestions(reordered);
        
        // Remove from available questions
        setAvailableQuestions(prev => prev.filter(q => q.id !== draggedItem.id));
        
        // Save assignment to backend
        await assignQuestionToSurvey(draggedItem.id, reordered);
      }
    } catch (err) {
      console.error('Failed to handle drop:', err);
      setError('質問の割り当てに失敗しました');
    } finally {
      setSaving(false);
      setDraggedItem(null);
    }
  };

  const handleDropToAvailable = async (e: React.DragEvent) => {
    e.preventDefault();
    
    if (!draggedItem || !('order_index' in draggedItem)) return;

    try {
      setSaving(true);
      
      // Remove from assigned questions
      const newAssigned = assignedQuestions.filter(q => q.id !== draggedItem.id);
      const reordered = newAssigned.map((q, index) => ({ ...q, order_index: index + 1 }));
      setAssignedQuestions(reordered);
      
      // Add to available questions
      const { order_index, ...questionWithoutOrder } = draggedItem;
      setAvailableQuestions(prev => [questionWithoutOrder, ...prev]);
      
      // Remove assignment from backend
      await unassignQuestionFromSurvey(draggedItem.id, reordered);
    } catch (err) {
      console.error('Failed to unassign question:', err);
      setError('質問の割り当て解除に失敗しました');
    } finally {
      setSaving(false);
      setDraggedItem(null);
    }
  };

  const assignQuestionToSurvey = async (questionId: number, reorderedQuestions: SurveyQuestion[]) => {
    // Mock API call - would implement actual backend endpoint
    console.log('Assigning question', questionId, 'to survey', surveyId);
    console.log('New order:', reorderedQuestions.map(q => ({ id: q.id, order: q.order_index })));
  };

  const unassignQuestionFromSurvey = async (questionId: number, remainingQuestions: SurveyQuestion[]) => {
    // Mock API call - would implement actual backend endpoint
    console.log('Unassigning question', questionId, 'from survey', surveyId);
    console.log('Remaining order:', remainingQuestions.map(q => ({ id: q.id, order: q.order_index })));
  };

  const saveQuestionOrder = async (questions: SurveyQuestion[]) => {
    // Mock API call - would implement actual backend endpoint
    console.log('Saving question order for survey', surveyId);
    console.log('Order:', questions.map(q => ({ id: q.id, order: q.order_index })));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setTypeFilter('');
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">質問割り当て</h1>
          {survey && (
            <p className="text-sm text-gray-600">
              調査「{survey.title}」に質問を割り当て、順序を設定します
            </p>
          )}
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
                    {Object.entries(CATEGORIES).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
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
                            <p className="text-sm text-gray-900">{question.question}</p>
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
                  割り当て済み質問 ({assignedQuestions.length})
                </h2>
                {assignedQuestions.length > 0 && (
                  <Button variant="secondary" size="sm">
                    プレビュー
                  </Button>
                )}
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
                              {question.order_index}
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
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
                              <p className="text-sm text-gray-900">{question.question}</p>
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
    </AdminLayout>
  );
}