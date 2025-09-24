import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SurveyOperationPanel } from '../SurveyOperationPanel';
import { operationService } from '../../../api/services/operationService';
import type { SurveyResponse } from '../../../types/survey';

// Mock the operation service
vi.mock('../../../api/services/operationService');
const mockOperationService = operationService as any;

// Mock survey data
const mockSurvey: SurveyResponse = {
  id: 1,
  title: 'Test Survey',
  description: 'Test Description',
  status: 'draft',
  start_date: '2024-01-01T00:00:00Z',
  end_date: '2024-12-31T23:59:59Z',
  is_anonymous: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  response_count: 0,
};

describe('SurveyOperationPanel', () => {
  const mockOnStatusChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render draft survey with start button', () => {
    render(
      <SurveyOperationPanel
        survey={mockSurvey}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText('調査運用管理')).toBeInTheDocument();
    expect(screen.getByText('下書き')).toBeInTheDocument();
    expect(screen.getByText('調査を開始')).toBeInTheDocument();
  });

  it('should render active survey with pause and stop buttons', () => {
    const activeSurvey = { ...mockSurvey, status: 'active' as const };

    render(
      <SurveyOperationPanel
        survey={activeSurvey}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText('アクティブ')).toBeInTheDocument();
    expect(screen.getByText('一時停止')).toBeInTheDocument();
    expect(screen.getByText('調査を終了')).toBeInTheDocument();
  });

  it('should render paused survey with resume and stop buttons', () => {
    const pausedSurvey = { ...mockSurvey, status: 'paused' as const };

    render(
      <SurveyOperationPanel
        survey={pausedSurvey}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText('一時停止中')).toBeInTheDocument();
    expect(screen.getByText('調査を再開')).toBeInTheDocument();
    expect(screen.getByText('調査を終了')).toBeInTheDocument();
  });

  it('should render closed survey with no action buttons', () => {
    const closedSurvey = { ...mockSurvey, status: 'closed' as const };

    render(
      <SurveyOperationPanel
        survey={closedSurvey}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText('終了')).toBeInTheDocument();
    expect(screen.getByText('この調査は終了しました。新しい回答は受け付けられません。')).toBeInTheDocument();
  });

  it('should call startSurvey when start button is clicked and confirmed', async () => {
    mockOperationService.startSurvey = vi.fn().mockResolvedValue({
      surveyId: 1,
      status: 'active',
      startedAt: '2024-01-01T10:00:00Z',
    });

    render(
      <SurveyOperationPanel
        survey={mockSurvey}
        onStatusChange={mockOnStatusChange}
      />
    );

    // Click start button
    fireEvent.click(screen.getByText('調査を開始'));

    // Confirm dialog should appear
    expect(screen.getByText('この調査を開始しますか？従業員が回答できるようになります。')).toBeInTheDocument();

    // Click confirm button
    fireEvent.click(screen.getByRole('button', { name: '開始' }));

    await waitFor(() => {
      expect(mockOperationService.startSurvey).toHaveBeenCalledWith(1);
      expect(mockOnStatusChange).toHaveBeenCalled();
    });
  });

  it('should handle operation errors', async () => {
    mockOperationService.startSurvey = vi.fn().mockRejectedValue(
      new Error('Operation failed')
    );

    render(
      <SurveyOperationPanel
        survey={mockSurvey}
        onStatusChange={mockOnStatusChange}
      />
    );

    // Click start button
    fireEvent.click(screen.getByText('調査を開始'));

    // Click confirm button
    fireEvent.click(screen.getByRole('button', { name: '開始' }));

    await waitFor(() => {
      expect(screen.getByText('操作に失敗しました: Operation failed')).toBeInTheDocument();
    });

    expect(mockOnStatusChange).not.toHaveBeenCalled();
  });

  it('should display survey period correctly', () => {
    render(
      <SurveyOperationPanel
        survey={mockSurvey}
        onStatusChange={mockOnStatusChange}
      />
    );

    expect(screen.getByText('調査期間')).toBeInTheDocument();
    expect(screen.getByText('2024/1/1 〜 2024/12/31')).toBeInTheDocument();
  });

  it('should cancel operation when cancel button is clicked', () => {
    render(
      <SurveyOperationPanel
        survey={mockSurvey}
        onStatusChange={mockOnStatusChange}
      />
    );

    // Click start button
    fireEvent.click(screen.getByText('調査を開始'));

    // Confirm dialog should appear
    expect(screen.getByText('この調査を開始しますか？従業員が回答できるようになります。')).toBeInTheDocument();

    // Click cancel button
    fireEvent.click(screen.getByText('キャンセル'));

    // Dialog should close
    expect(screen.queryByText('この調査を開始しますか？従業員が回答できるようになります。')).not.toBeInTheDocument();
    expect(mockOperationService.startSurvey).not.toHaveBeenCalled();
  });
});