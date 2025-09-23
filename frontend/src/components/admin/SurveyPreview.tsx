import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import { Card, Button, Loading, Alert } from '../ui';
import type { SurveyResponse } from '../../types/survey';

type ViewMode = 'desktop' | 'mobile' | 'print';

export function SurveyPreview(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [survey, setSurvey] = useState<SurveyResponse | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadSurvey();
    }
  }, [id]);

  const loadSurvey = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // Mock survey data
      const mockSurvey: SurveyResponse = {
        id: parseInt(id),
        title: "2024年度エンゲージメント調査",
        description: "従業員のエンゲージメント向上を目的とした調査です",
        start_date: "2024-01-01T00:00:00Z",
        end_date: "2024-12-31T23:59:59Z",
        is_anonymous: true,
        status: "active",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z"
      };
      setSurvey(mockSurvey);
    } catch (err) {
      setError('調査データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loading size="lg" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !survey) {
    return (
      <AdminLayout>
        <Alert variant="danger" title="エラー">
          調査データの取得に失敗しました。
        </Alert>
      </AdminLayout>
    );
  }

  const containerClasses = {
    desktop: 'max-w-4xl mx-auto',
    mobile: 'max-w-sm mx-auto',
    print: 'max-w-full',
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">調査プレビュー</h1>
            <p className="mt-1 text-sm text-gray-600">
              回答者の視点で調査を確認できます
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* View Mode Selector */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('desktop')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'desktop'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🖥️ デスクトップ
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'mobile'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📱 モバイル
              </button>
              <button
                onClick={() => setViewMode('print')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'print'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🖨️ 印刷
              </button>
            </div>

            <Button variant="secondary" size="md" onClick={handlePrint}>
              印刷
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate('/admin/surveys')}
            >
              戻る
            </Button>
          </div>
        </div>

        {/* Preview Container */}
        <div className={`${containerClasses[viewMode]} transition-all duration-300`}>
          <div className={viewMode === 'mobile' ? 'border-2 border-gray-300 rounded-lg overflow-hidden' : ''}>
            {/* Survey Header */}
            <Card variant="default" padding="lg" className={viewMode === 'print' ? 'print:shadow-none' : ''}>
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
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
                    
                    <div>
                      <span className="font-medium text-blue-900">所要時間:</span>
                      <div className="text-blue-700">約10-15分</div>
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

            {/* Sample Questions */}
            <div className="space-y-4">
              <Card variant="default" padding="lg">
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      調査質問（サンプル）
                    </h2>
                    <p className="text-sm text-gray-600">
                      実際の調査では質問バンクから選択された質問が表示されます
                    </p>
                  </div>

                  {/* Sample Question 1 - Scale */}
                  <div className="border-b border-gray-200 pb-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        1. 現在の職場に対する満足度はいかがですか？
                        <span className="text-red-500 ml-1">*</span>
                      </h3>
                      <p className="text-sm text-gray-600">
                        1（全く満足していない）から5（とても満足している）までの5段階で評価してください。
                      </p>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">全く満足していない</span>
                      <div className="flex space-x-4">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <label key={num} className="flex flex-col items-center">
                            <input
                              type="radio"
                              name="satisfaction"
                              value={num}
                              className="h-4 w-4 text-blue-600"
                              disabled
                            />
                            <span className="text-sm text-gray-700 mt-1">{num}</span>
                          </label>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">とても満足している</span>
                    </div>
                  </div>

                  {/* Sample Question 2 - Multiple Choice */}
                  <div className="border-b border-gray-200 pb-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        2. あなたが最も重視する職場の要素はどれですか？
                        <span className="text-red-500 ml-1">*</span>
                      </h3>
                    </div>
                    
                    <div className="space-y-3">
                      {[
                        '給与・待遇',
                        'ワークライフバランス',
                        '職場の人間関係',
                        '仕事のやりがい',
                        'キャリア成長の機会',
                        'その他',
                      ].map((option, index) => (
                        <label key={index} className="flex items-center">
                          <input
                            type="radio"
                            name="priority"
                            className="h-4 w-4 text-blue-600"
                            disabled
                          />
                          <span className="ml-2 text-gray-900">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Sample Question 3 - Text */}
                  <div className="border-b border-gray-200 pb-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        3. 職場環境について、改善してほしい点があれば自由にお書きください。
                      </h3>
                      <p className="text-sm text-gray-600">任意回答</p>
                    </div>
                    
                    <textarea
                      className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
                      rows={4}
                      placeholder="自由にお書きください（任意）"
                      disabled
                    />
                  </div>

                  {/* Sample Question 4 - Yes/No */}
                  <div>
                    <div className="mb-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        4. 今後もこの組織で働き続けたいと思いますか？
                        <span className="text-red-500 ml-1">*</span>
                      </h3>
                    </div>
                    
                    <div className="flex space-x-6">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="stay"
                          value="yes"
                          className="h-4 w-4 text-blue-600"
                          disabled
                        />
                        <span className="ml-2 text-gray-900">はい</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="stay"
                          value="no"
                          className="h-4 w-4 text-blue-600"
                          disabled
                        />
                        <span className="ml-2 text-gray-900">いいえ</span>
                      </label>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Submit Section */}
              <Card variant="default" padding="lg">
                <div className="text-center space-y-4">
                  <p className="text-sm text-gray-600">
                    すべての必須項目にご回答いただき、ありがとうございます。
                  </p>
                  
                  <div className="flex justify-center space-x-4">
                    <Button variant="secondary" size="md" disabled>
                      下書き保存
                    </Button>
                    <Button variant="primary" size="md" disabled>
                      回答を送信
                    </Button>
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    送信後は回答内容の変更ができませんのでご注意ください。
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <Card variant="default" padding="md" className="print:hidden">
          <div className="text-center text-sm text-gray-600">
            <p>
              このプレビューは管理者用です。実際の調査では質問バンクから選択された質問が表示されます。
            </p>
          </div>
        </Card>
      </div>

      {/* Print styles would be added via CSS file */}
    </AdminLayout>
  );
}