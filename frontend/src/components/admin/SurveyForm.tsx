import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import { Card, Button, Input, Alert, Loading } from '../ui';
import { FormField, ValidationMessage } from '../forms';
import { SurveyService } from '../../api/services/surveyService';
import type { CreateSurveyDto, SurveyStatus } from '../../types/survey';

interface SurveyFormData {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  is_anonymous: boolean;
  status: SurveyStatus;
}

interface ValidationErrors {
  title?: string;
  start_date?: string;
  end_date?: string;
  general?: string;
}

export function SurveyForm(): JSX.Element {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState<SurveyFormData>({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    is_anonymous: true,
    status: 'draft',
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isDirty, setIsDirty] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  // Load existing survey for edit
  useEffect(() => {
    if (isEdit && id) {
      loadSurvey();
    }
  }, [isEdit, id]);

  const loadSurvey = async () => {
    if (!id) return;

    setLoadingData(true);
    try {
      // Load actual survey data from API
      const response = await SurveyService.getSurveyById(id);
      const surveyData = response.data;

      setFormData({
        title: surveyData.title,
        description: surveyData.description || '',
        start_date: surveyData.start_date ? surveyData.start_date.split('T')[0] : '',
        end_date: surveyData.end_date ? surveyData.end_date.split('T')[0] : '',
        is_anonymous: surveyData.is_anonymous || false,
        status: surveyData.status,
      });
    } catch (err) {
      setError('調査データの読み込みに失敗しました');
    } finally {
      setLoadingData(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'タイトルは必須です';
    } else if (formData.title.length > 255) {
      newErrors.title = 'タイトルは255文字以内で入力してください';
    }

    if (!formData.start_date) {
      newErrors.start_date = '開始日は必須です';
    }

    if (!formData.end_date) {
      newErrors.end_date = '終了日は必須です';
    }

    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);

      if (endDate <= startDate) {
        newErrors.end_date = '終了日は開始日より後の日付を選択してください';
      }

      // 今日の日付を00:00:00にセット
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const inputDate = new Date(formData.start_date);
      inputDate.setHours(0, 0, 0, 0);

      if (inputDate < today) {
        newErrors.start_date = '開始日は今日以降の日付を選択してください';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof SurveyFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);

    // Clear field error when user starts typing
    if (errors[field as keyof ValidationErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (saveAsDraft: boolean = false) => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const submitData: CreateSurveyDto = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        start_date: new Date(formData.start_date + 'T00:00:00.000Z').toISOString(),
        end_date: new Date(formData.end_date + 'T23:59:59.999Z').toISOString(),
        is_anonymous: formData.is_anonymous,
        status: saveAsDraft ? 'draft' : formData.status,
      };

      // Call appropriate API method based on mode
      const response = isEdit && id
        ? await SurveyService.updateSurvey(id, submitData)
        : await SurveyService.createSurvey(submitData);

      console.log('Survey saved:', response);
      navigate('/admin/surveys');
    } catch (err) {
      // Fix: Set both error states to ensure error display works
      const errorMessage = '保存に失敗しました。再度お試しください。';
      setError(errorMessage);
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      if (window.confirm('変更が保存されていません。ページを離れますか？')) {
        navigate('/admin/surveys');
      }
    } else {
      navigate('/admin/surveys');
    }
  };

  if (loadingData) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loading size="lg" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? '調査を編集' : '新しい調査を作成'}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            組織エンゲージメント調査の設定を行います
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="danger" title="エラー">
            {errors.general || '処理中にエラーが発生しました。'}
          </Alert>
        )}

        {/* Form */}
        <Card variant="default" padding="lg">
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">基本情報</h3>

              <div className="space-y-4">
                <FormField label="調査タイトル" isRequired>
                  <Input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="例: 2024年度エンゲージメント調査"
                    maxLength={255}
                  />
                  {errors.title && <ValidationMessage type="error" message={errors.title} />}
                </FormField>

                <FormField label="調査説明">
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="調査の目的や概要を記入してください（任意）"
                  />
                </FormField>
              </div>
            </div>

            {/* Schedule */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">実施期間</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="開始日" isRequired>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {errors.start_date && <ValidationMessage type="error" message={errors.start_date} />}
                </FormField>

                <FormField label="終了日" isRequired>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                    min={formData.start_date || new Date().toISOString().split('T')[0]}
                  />
                  {errors.end_date && <ValidationMessage type="error" message={errors.end_date} />}
                </FormField>
              </div>
            </div>

            {/* Settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">設定</h3>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_anonymous"
                    checked={formData.is_anonymous}
                    onChange={(e) => handleInputChange('is_anonymous', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_anonymous" className="ml-2 block text-sm text-gray-900">
                    匿名回答を有効にする（推奨）
                  </label>
                </div>

                <p className="text-sm text-gray-600">
                  匿名回答を有効にすると、回答者の個人情報は一切記録されません。
                  組織調査では匿名性の確保が重要です。
                </p>
              </div>
            </div>

            {/* Status (for edit mode) */}
            {isEdit && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">ステータス</h3>

                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="status"
                      value="draft"
                      checked={formData.status === 'draft'}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-900">下書き</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={formData.status === 'active'}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-900">アクティブ（公開）</span>
                  </label>
                </div>
              </div>
            )}
          </form>
        </Card>

        {/* Actions */}
        <div className="flex justify-between">
          <Button
            variant="secondary"
            size="md"
            onClick={handleCancel}
            disabled={loading}
          >
            キャンセル
          </Button>

          <div className="flex space-x-3">
            <Button
              variant="secondary"
              size="md"
              onClick={() => handleSubmit(true)}
              disabled={loading}
            >
              下書き保存
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={() => handleSubmit(false)}
              disabled={loading}
            >
              {loading ? '保存中...' : (isEdit ? '更新' : '作成')}
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}