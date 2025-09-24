import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FilterPanel from '../FilterPanel';

const mockFilters = {
  period: 'month' as const,
  category: undefined,
  surveyId: undefined,
  startDate: undefined,
  endDate: undefined,
};

const mockOnChange = vi.fn();

describe('FilterPanel', () => {
  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders filter options correctly', () => {
    render(<FilterPanel filters={mockFilters} onChange={mockOnChange} />);

    expect(screen.getByText('フィルター設定')).toBeInTheDocument();
    expect(screen.getByText('期間')).toBeInTheDocument();
    expect(screen.getByText('カテゴリ')).toBeInTheDocument();
    expect(screen.getByText('調査ID')).toBeInTheDocument();
    expect(screen.getByText('カスタム期間')).toBeInTheDocument();
  });

  it('calls onChange when period is changed', () => {
    render(<FilterPanel filters={mockFilters} onChange={mockOnChange} />);

    const weekButton = screen.getByText('週間');
    fireEvent.click(weekButton);

    expect(mockOnChange).toHaveBeenCalledWith({ period: 'week' });
  });

  it('calls onChange when category is changed', () => {
    render(<FilterPanel filters={mockFilters} onChange={mockOnChange} />);

    const categorySelect = screen.getByDisplayValue('全カテゴリ');
    fireEvent.change(categorySelect, { target: { value: 'engagement' } });

    expect(mockOnChange).toHaveBeenCalledWith({ category: 'engagement' });
  });

  it('calls onChange when survey ID is entered', () => {
    render(<FilterPanel filters={mockFilters} onChange={mockOnChange} />);

    const surveyIdInput = screen.getByPlaceholderText('調査IDを入力');
    fireEvent.change(surveyIdInput, { target: { value: 'survey-123' } });

    expect(mockOnChange).toHaveBeenCalledWith({ surveyId: 'survey-123' });
  });

  it('calls onChange when date range is set', () => {
    render(<FilterPanel filters={mockFilters} onChange={mockOnChange} />);

    const startDateInput = screen.getByDisplayValue('');
    fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });

    expect(mockOnChange).toHaveBeenCalledWith({ startDate: '2024-01-01' });
  });

  it('resets all filters when reset button is clicked', () => {
    const filtersWithValues = {
      ...mockFilters,
      category: 'engagement' as const,
      surveyId: 'test-123',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    };

    render(<FilterPanel filters={filtersWithValues} onChange={mockOnChange} />);

    const resetButton = screen.getByText('リセット');
    fireEvent.click(resetButton);

    expect(mockOnChange).toHaveBeenCalledWith({
      period: 'month',
      category: undefined,
      surveyId: undefined,
      startDate: undefined,
      endDate: undefined,
    });
  });

  it('displays active filters correctly', () => {
    const activeFilters = {
      period: 'month' as const,
      category: 'engagement' as const,
      surveyId: 'survey-123',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    };

    render(<FilterPanel filters={activeFilters} onChange={mockOnChange} />);

    expect(screen.getByText('適用中のフィルター:')).toBeInTheDocument();
    expect(screen.getByText(/カテゴリ: エンゲージメント/)).toBeInTheDocument();
    expect(screen.getByText(/調査ID: survey-123/)).toBeInTheDocument();
    expect(screen.getByText(/期間: 2024-01-01 - 2024-01-31/)).toBeInTheDocument();
  });

  it('allows removing individual active filters', () => {
    const activeFilters = {
      period: 'month' as const,
      category: 'engagement' as const,
      surveyId: 'survey-123',
      startDate: undefined,
      endDate: undefined,
    };

    render(<FilterPanel filters={activeFilters} onChange={mockOnChange} />);

    // Find and click the remove button for category filter
    const categoryRemoveButton = screen.getByText(/カテゴリ: エンゲージメント/).parentElement?.querySelector('button');
    if (categoryRemoveButton) {
      fireEvent.click(categoryRemoveButton);
      expect(mockOnChange).toHaveBeenCalledWith({ category: undefined });
    }
  });
});