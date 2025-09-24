import { useState } from 'react';
import { Button, Card, Alert, Modal } from '../ui';
import { operationService } from '../../api/services/operationService';
import type { SurveyResponse } from '../../types/survey';

interface SurveyOperationPanelProps {
  survey: SurveyResponse;
  onStatusChange: () => void;
}

export function SurveyOperationPanel({ survey, onStatusChange }: SurveyOperationPanelProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'start' | 'stop' | 'pause' | 'resume' | null>(null);

  const handleOperation = async (action: 'start' | 'stop' | 'pause' | 'resume') => {
    setPendingAction(action);
    setShowConfirmModal(true);
  };

  const confirmOperation = async () => {
    if (!pendingAction) return;

    setLoading(true);
    setError(null);
    setShowConfirmModal(false);

    try {
      switch (pendingAction) {
        case 'start':
          await operationService.startSurvey(survey.id);
          break;
        case 'stop':
          await operationService.stopSurvey(survey.id);
          break;
        case 'pause':
          await operationService.pauseSurvey(survey.id);
          break;
        case 'resume':
          await operationService.resumeSurvey(survey.id);
          break;
      }
      onStatusChange();
    } catch (err) {
      setError(`操作に失敗しました: ${err instanceof Error ? err.message : '不明なエラー'}`);
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'start':
        return '開始';
      case 'stop':
        return '終了';
      case 'pause':
        return '一時停止';
      case 'resume':
        return '再開';
      default:
        return action;
    }
  };

  const getConfirmMessage = () => {
    if (!pendingAction) return '';

    switch (pendingAction) {
      case 'start':
        return 'この調査を開始しますか？従業員が回答できるようになります。';
      case 'stop':
        return 'この調査を終了しますか？これ以降、新しい回答は受け付けられません。';
      case 'pause':
        return 'この調査を一時停止しますか？再開するまで新しい回答は受け付けられません。';
      case 'resume':
        return 'この調査を再開しますか？従業員が再び回答できるようになります。';
      default:
        return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft':
        return '下書き';
      case 'active':
        return 'アクティブ';
      case 'paused':
        return '一時停止中';
      case 'closed':
        return '終了';
      default:
        return status;
    }
  };

  return (
    <>
      <Card variant="default" padding="md">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">調査運用管理</h3>
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
                survey.status
              )}`}
            >
              {getStatusLabel(survey.status)}
            </span>
          </div>

          {error && (
            <Alert variant="danger" title="エラー">
              {error}
            </Alert>
          )}

          <div className="flex flex-wrap gap-2">
            {survey.status === 'draft' && (
              <Button
                variant="primary"
                size="md"
                onClick={() => handleOperation('start')}
                disabled={loading}
              >
                調査を開始
              </Button>
            )}

            {survey.status === 'active' && (
              <>
                <Button
                  variant="warning"
                  size="md"
                  onClick={() => handleOperation('pause')}
                  disabled={loading}
                >
                  一時停止
                </Button>
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => handleOperation('stop')}
                  disabled={loading}
                >
                  調査を終了
                </Button>
              </>
            )}

            {survey.status === 'paused' && (
              <>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleOperation('resume')}
                  disabled={loading}
                >
                  調査を再開
                </Button>
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => handleOperation('stop')}
                  disabled={loading}
                >
                  調査を終了
                </Button>
              </>
            )}

            {survey.status === 'closed' && (
              <div className="text-sm text-gray-600">
                この調査は終了しました。新しい回答は受け付けられません。
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">調査期間</h4>
            <div className="text-sm text-gray-600">
              {new Date(survey.start_date).toLocaleDateString('ja-JP')} 〜{' '}
              {new Date(survey.end_date).toLocaleDateString('ja-JP')}
            </div>
          </div>
        </div>
      </Card>

      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={`調査を${pendingAction ? getActionLabel(pendingAction) : ''}しますか？`}
      >
        <div className="space-y-4">
          <p className="text-gray-600">{getConfirmMessage()}</p>
          <div className="flex justify-end space-x-2">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setShowConfirmModal(false)}
            >
              キャンセル
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={confirmOperation}
              disabled={loading}
            >
              {pendingAction ? getActionLabel(pendingAction) : ''}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}