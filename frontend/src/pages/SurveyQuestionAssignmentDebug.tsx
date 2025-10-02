import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin';

export function SurveyQuestionAssignmentDebug(): JSX.Element {
  const { surveyId } = useParams<{ surveyId: string }>();
  const [debugInfo, setDebugInfo] = useState<string>('初期化中...');

  useEffect(() => {
    if (surveyId) {
      setDebugInfo(`Survey ID: ${surveyId} - コンポーネント読み込み完了`);
    } else {
      setDebugInfo('Survey ID が取得できません');
    }
  }, [surveyId]);

  if (!surveyId) {
    return (
      <AdminLayout>
        <div className="p-8">
          <h1 className="text-2xl font-bold text-gray-900">エラー</h1>
          <p className="text-red-600">調査IDが指定されていません</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900">質問割り当て（デバッグ版）</h1>
        <p className="text-sm text-gray-600 mb-4">
          調査「{surveyId}」に質問を割り当て、順序を設定します
        </p>

        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <p><strong>デバッグ情報:</strong> {debugInfo}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 利用可能な質問 */}
          <div className="space-y-4">
            <div className="p-4 border border-gray-300 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">利用可能な質問</h2>
              <div className="bg-gray-50 p-4 rounded">
                <p>ここに利用可能な質問が表示されます</p>
              </div>
            </div>
          </div>

          {/* 割り当て済み質問 */}
          <div className="space-y-4">
            <div className="p-4 border border-gray-300 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                割り当て済み質問 (0)
              </h2>
              <div className="bg-blue-50 p-4 rounded text-center">
                <p>ここに質問をドラッグしてください</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}