import React from 'react';
import { Card, Button, Input } from '@/components/ui';

interface FilterState {
  period: 'week' | 'month' | 'quarter' | 'year';
  category?: 'engagement' | 'satisfaction' | 'leadership' | 'culture' | 'growth' | 'worklife' | 'communication' | 'other';
  surveyId?: string;
  startDate?: string;
  endDate?: string;
}

interface FilterPanelProps {
  filters: FilterState;
  onChange: (filters: Partial<FilterState>) => void;
}

const PERIOD_OPTIONS = [
  { value: 'week', label: '週間' },
  { value: 'month', label: '月間' },
  { value: 'quarter', label: '四半期' },
  { value: 'year', label: '年間' },
] as const;

const CATEGORY_OPTIONS = [
  { value: '', label: '全カテゴリ' },
  { value: 'engagement', label: 'エンゲージメント' },
  { value: 'satisfaction', label: '満足度' },
  { value: 'leadership', label: 'リーダーシップ' },
  { value: 'culture', label: '企業文化' },
  { value: 'growth', label: '成長・キャリア' },
  { value: 'worklife', label: 'ワークライフバランス' },
  { value: 'communication', label: 'コミュニケーション' },
  { value: 'other', label: 'その他' },
] as const;

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onChange }) => {
  const handlePeriodChange = (period: FilterState['period']) => {
    onChange({ period });
  };

  const handleCategoryChange = (category: string) => {
    onChange({ 
      category: category === '' ? undefined : category as FilterState['category']
    });
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    onChange({ [field]: value || undefined });
  };

  const handleSurveyIdChange = (surveyId: string) => {
    onChange({ surveyId: surveyId || undefined });
  };

  const handleReset = () => {
    onChange({
      period: 'month',
      category: undefined,
      surveyId: undefined,
      startDate: undefined,
      endDate: undefined,
    });
  };

  return (
    <Card variant="default" padding="lg">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            フィルター設定
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
          >
            リセット
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Period Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              期間
            </label>
            <div className="flex flex-wrap gap-2">
              {PERIOD_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={filters.period === option.value ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handlePeriodChange(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              カテゴリ
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={filters.category || ''}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Survey ID Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              調査ID
            </label>
            <Input
              type="text"
              placeholder="調査IDを入力"
              value={filters.surveyId || ''}
              onChange={(e) => handleSurveyIdChange(e.target.value)}
            />
          </div>

          {/* Custom Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              カスタム期間
            </label>
            <div className="space-y-2">
              <Input
                type="date"
                placeholder="開始日"
                value={filters.startDate || ''}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
              />
              <Input
                type="date"
                placeholder="終了日"
                value={filters.endDate || ''}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {(filters.category || filters.surveyId || filters.startDate || filters.endDate) && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              適用中のフィルター:
            </h4>
            <div className="flex flex-wrap gap-2">
              {filters.category && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  カテゴリ: {CATEGORY_OPTIONS.find(cat => cat.value === filters.category)?.label}
                  <button
                    onClick={() => handleCategoryChange('')}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.surveyId && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  調査ID: {filters.surveyId}
                  <button
                    onClick={() => handleSurveyIdChange('')}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {(filters.startDate || filters.endDate) && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  期間: {filters.startDate || '開始日未設定'} - {filters.endDate || '終了日未設定'}
                  <button
                    onClick={() => {
                      handleDateChange('startDate', '');
                      handleDateChange('endDate', '');
                    }}
                    className="ml-2 text-yellow-600 hover:text-yellow-800"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default FilterPanel;