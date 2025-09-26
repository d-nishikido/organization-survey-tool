import { useState, useEffect } from 'react';
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AdminLayout } from '../components/admin';
import { SurveyOperationPanel } from '../components/admin/SurveyOperationPanel';
import { ReminderSettings } from '../components/admin/ReminderSettings';
import { ParticipationMonitor } from '../components/admin/ParticipationMonitor';
import { Card, Loading, Alert, Button } from '../components/ui';
import { SurveyService } from '../api/services/surveyService';
import type { SurveyResponse } from '../types/survey';

export function SurveyOperations(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const surveyId = parseInt(id || '0', 10);

  const [survey, setSurvey] = useState<SurveyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'operations' | 'reminders' | 'participation'>('operations');

  useEffect(() => {
    if (surveyId) {
      fetchSurvey();
    }
  }, [surveyId]);

  const fetchSurvey = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await SurveyService.getSurveyById(surveyId.toString());
      setSurvey(response.data);
    } catch (err) {
      setError('調査の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = () => {
    // Refresh survey data after status change
    fetchSurvey();
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
          {error || '調査が見つかりません'}
        </Alert>
        <div className="mt-4">
          <Link to="/admin/surveys">
            <Button variant="secondary" size="md">
              調査一覧に戻る
            </Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">調査運用管理</h1>
            <p className="mt-1 text-sm text-gray-600">{survey.title}</p>
          </div>
          <Link to="/admin/surveys">
            <Button variant="secondary" size="md">
              調査一覧に戻る
            </Button>
          </Link>
        </div>

        {/* Survey Info */}
        <Card variant="default" padding="md">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600">調査期間</div>
              <div className="mt-1 font-medium">
                {new Date(survey.start_date).toLocaleDateString('ja-JP')} 〜{' '}
                {new Date(survey.end_date).toLocaleDateString('ja-JP')}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">ステータス</div>
              <div className="mt-1">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    survey.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : survey.status === 'paused'
                      ? 'bg-yellow-100 text-yellow-800'
                      : survey.status === 'closed'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {survey.status === 'active'
                    ? 'アクティブ'
                    : survey.status === 'paused'
                    ? '一時停止中'
                    : survey.status === 'closed'
                    ? '終了'
                    : '下書き'}
                </span>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">回答数</div>
              <div className="mt-1 font-medium">{survey.response_count || 0}件</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">匿名調査</div>
              <div className="mt-1 font-medium">
                {survey.is_anonymous ? 'はい' : 'いいえ'}
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('operations')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'operations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              運用管理
            </button>
            <button
              onClick={() => setActiveTab('reminders')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reminders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              リマインダー設定
            </button>
            <button
              onClick={() => setActiveTab('participation')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'participation'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              参加状況
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'operations' && (
            <SurveyOperationPanel
              survey={survey}
              onStatusChange={handleStatusChange}
            />
          )}

          {activeTab === 'reminders' && (
            <ReminderSettings surveyId={survey.id} />
          )}

          {activeTab === 'participation' && (
            <ParticipationMonitor surveyId={survey.id} />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}