import React, { useState } from 'react';
import { Button, Modal } from '@/components/ui';
import { analyticsService } from '@/api/services';

interface ExportToolsProps {
  onExport: (format: 'csv' | 'excel' | 'pdf') => Promise<void>;
  surveyId?: string;
  disabled?: boolean;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'csv' | 'excel' | 'pdf', options: ExportOptions) => Promise<void>;
}

interface ExportOptions {
  includeRawData: boolean;
  includeCharts: boolean;
  dateRange: {
    startDate?: string;
    endDate?: string;
  };
  categories: string[];
}

const EXPORT_FORMATS = [
  { value: 'csv', label: 'CSV', description: 'データのみ（Excel等で開ける）' },
  { value: 'excel', label: 'Excel', description: 'グラフと表を含む詳細レポート' },
  { value: 'pdf', label: 'PDF', description: 'プレゼンテーション用レポート' },
] as const;

const CATEGORIES = [
  'engagement',
  'satisfaction',
  'leadership',
  'culture',
  'growth',
  'worklife',
  'communication',
  'other',
];

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, onExport }) => {
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'excel' | 'pdf'>('excel');
  const [options, setOptions] = useState<ExportOptions>({
    includeRawData: true,
    includeCharts: true,
    dateRange: {},
    categories: [...CATEGORIES],
  });
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport(selectedFormat, options);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCategoryToggle = (category: string) => {
    setOptions(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category],
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="データエクスポート">
      <div className="space-y-6">
        {/* Format Selection */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            エクスポート形式
          </h4>
          <div className="space-y-2">
            {EXPORT_FORMATS.map((format) => (
              <label
                key={format.value}
                className="flex items-start space-x-3 cursor-pointer"
              >
                <input
                  type="radio"
                  name="format"
                  value={format.value}
                  checked={selectedFormat === format.value}
                  onChange={(e) => setSelectedFormat(e.target.value as typeof selectedFormat)}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium">{format.label}</div>
                  <div className="text-sm text-gray-500">{format.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Export Options */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            エクスポートオプション
          </h4>
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={options.includeRawData}
                onChange={(e) =>
                  setOptions(prev => ({ ...prev, includeRawData: e.target.checked }))
                }
              />
              <span className="text-sm">生データを含める</span>
            </label>

            {selectedFormat !== 'csv' && (
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={options.includeCharts}
                  onChange={(e) =>
                    setOptions(prev => ({ ...prev, includeCharts: e.target.checked }))
                  }
                />
                <span className="text-sm">グラフを含める</span>
              </label>
            )}
          </div>
        </div>

        {/* Date Range */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            期間設定（オプション）
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">開始日</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={options.dateRange.startDate || ''}
                onChange={(e) =>
                  setOptions(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, startDate: e.target.value }
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">終了日</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                value={options.dateRange.endDate || ''}
                onChange={(e) =>
                  setOptions(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, endDate: e.target.value }
                  }))
                }
              />
            </div>
          </div>
        </div>

        {/* Category Selection */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            カテゴリ選択
          </h4>
          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
            {CATEGORIES.map((category) => (
              <label key={category} className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={options.categories.includes(category)}
                  onChange={() => handleCategoryToggle(category)}
                />
                <span className="capitalize">{category}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isExporting}
          >
            キャンセル
          </Button>
          <Button
            variant="primary"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? 'エクスポート中...' : 'エクスポート'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

const ExportTools: React.FC<ExportToolsProps> = ({ onExport, surveyId, disabled = false }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleQuickExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      await onExport(format);
    } catch (error) {
      console.error('Quick export failed:', error);
    }
  };

  const handleAdvancedExport = async (format: 'csv' | 'excel' | 'pdf', options: ExportOptions) => {
    try {
      if (surveyId) {
        // Create report request with proper options
        const reportRequest = {
          surveyId: parseInt(surveyId),
          format,
          template: 'summary' as const,
          options: {
            includeRawData: options.includeRawData,
            includeCharts: options.includeCharts,
            dateRange: options.dateRange,
            categories: options.categories,
          },
        };

        // Generate report
        const generateResponse = await analyticsService.generateReport(reportRequest);
        const { reportId } = generateResponse.data;

        // Poll for completion
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds max wait
        
        const pollStatus = async (): Promise<void> => {
          const statusResponse = await analyticsService.getReportStatus(reportId);
          const job = statusResponse.data;
          
          if (job.status === 'completed') {
            // Download the report
            const blob = await analyticsService.downloadReport(reportId);
            
            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `survey-analytics-${surveyId}.${format === 'excel' ? 'xlsx' : format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          } else if (job.status === 'failed') {
            throw new Error(job.error || 'Report generation failed');
          } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(pollStatus, 1000); // Wait 1 second before next check
          } else {
            throw new Error('Report generation timed out');
          }
        };

        await pollStatus();
      }
    } catch (error) {
      console.error('Advanced export failed:', error);
      throw error;
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Quick Export Buttons */}
      <div className="hidden md:flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickExport('csv')}
          disabled={disabled}
          title="CSV形式でエクスポート"
        >
          📊 CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickExport('excel')}
          disabled={disabled}
          title="Excel形式でエクスポート"
        >
          📈 Excel
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickExport('pdf')}
          disabled={disabled}
          title="PDF形式でエクスポート"
        >
          📄 PDF
        </Button>
      </div>

      {/* Advanced Export Button */}
      <Button
        variant="primary"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        disabled={disabled}
      >
        📤 詳細エクスポート
      </Button>

      {/* Export Modal */}
      <ExportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onExport={handleAdvancedExport}
      />
    </div>
  );
};

export default ExportTools;