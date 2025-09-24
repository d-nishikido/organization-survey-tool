import { useState, useEffect } from 'react';
import { Button, Card, Input, Alert, Modal } from '../ui';
import { operationService } from '../../api/services/operationService';
import type { ReminderSettings as ReminderSettingsType, ReminderFrequency } from '../../types/operation';

interface ReminderSettingsProps {
  surveyId: number;
}

export function ReminderSettings({ surveyId }: ReminderSettingsProps) {
  const [reminders, setReminders] = useState<ReminderSettingsType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ReminderSettingsType | null>(null);

  // Form state
  const [frequency, setFrequency] = useState<ReminderFrequency>('once');
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [message, setMessage] = useState('');
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    fetchReminders();
  }, [surveyId]);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const data = await operationService.getSurveyReminders(surveyId);
      setReminders(data);
    } catch (err) {
      setError('リマインダーの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (reminder?: ReminderSettingsType) => {
    if (reminder) {
      setEditingReminder(reminder);
      setFrequency(reminder.frequency);
      setScheduleTime(reminder.scheduleTime);
      setMessage(reminder.message);
      setEnabled(reminder.enabled);
    } else {
      setEditingReminder(null);
      setFrequency('once');
      setScheduleTime('09:00');
      setMessage('');
      setEnabled(true);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingReminder(null);
    setFrequency('once');
    setScheduleTime('09:00');
    setMessage('');
    setEnabled(true);
  };

  const handleSaveReminder = async () => {
    setError(null);

    if (!message.trim()) {
      setError('メッセージを入力してください');
      return;
    }

    setLoading(true);

    try {
      const reminderData: ReminderSettingsType = {
        surveyId,
        frequency,
        scheduleTime,
        message,
        enabled,
      };

      if (editingReminder?.id) {
        await operationService.updateReminder(surveyId, editingReminder.id, reminderData);
      } else {
        await operationService.createReminder(reminderData);
      }

      await fetchReminders();
      handleCloseModal();
    } catch (err) {
      setError('リマインダーの保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReminder = async (reminderId: number) => {
    if (!confirm('このリマインダーを削除しますか？')) {
      return;
    }

    setLoading(true);
    try {
      await operationService.deleteReminder(surveyId, reminderId);
      await fetchReminders();
    } catch (err) {
      setError('リマインダーの削除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = async (reminder: ReminderSettingsType) => {
    setLoading(true);
    try {
      await operationService.updateReminder(surveyId, reminder.id!, {
        enabled: !reminder.enabled,
      });
      await fetchReminders();
    } catch (err) {
      setError('リマインダーの更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const getFrequencyLabel = (freq: ReminderFrequency) => {
    switch (freq) {
      case 'once':
        return '1回のみ';
      case 'daily':
        return '毎日';
      case 'weekly':
        return '毎週';
      default:
        return freq;
    }
  };

  return (
    <>
      <Card variant="default" padding="md">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">リマインダー設定</h3>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenModal()}
              disabled={loading}
            >
              新しいリマインダー
            </Button>
          </div>

          {error && (
            <Alert variant="danger" title="エラー">
              {error}
            </Alert>
          )}

          {reminders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🔔</div>
              <p>リマインダーが設定されていません</p>
              <p className="text-sm mt-2">
                リマインダーを設定して、従業員に調査への参加を促しましょう
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          {getFrequencyLabel(reminder.frequency)}
                        </span>
                        <span className="text-sm text-gray-600">
                          {reminder.scheduleTime}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            reminder.enabled
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {reminder.enabled ? '有効' : '無効'}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-700">
                        {reminder.message}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleToggleEnabled(reminder)}
                        disabled={loading}
                      >
                        {reminder.enabled ? '無効化' : '有効化'}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenModal(reminder)}
                        disabled={loading}
                      >
                        編集
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteReminder(reminder.id!)}
                        disabled={loading}
                      >
                        削除
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t pt-4">
            <p className="text-sm text-gray-600">
              ※ リマインダーの実際の送信機能は今後実装予定です。現在は設定の保存のみ可能です。
            </p>
          </div>
        </div>
      </Card>

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingReminder ? 'リマインダーを編集' : '新しいリマインダー'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              頻度
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as ReminderFrequency)}
            >
              <option value="once">1回のみ</option>
              <option value="daily">毎日</option>
              <option value="weekly">毎週</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              送信時刻
            </label>
            <Input
              type="time"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メッセージ
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="従業員へのリマインダーメッセージを入力してください"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="enabled"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="enabled" className="text-sm text-gray-700">
              このリマインダーを有効にする
            </label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="secondary" size="md" onClick={handleCloseModal}>
              キャンセル
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSaveReminder}
              disabled={loading}
            >
              保存
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}