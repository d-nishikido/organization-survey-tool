import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AnalyticsCards from '../AnalyticsCards';

const mockSummary = {
  totalSurveys: 12,
  completedSurveys: 8,
  averageCompletionRate: 78.3,
  responseRate: 85.2,
  totalResponses: 1247,
  averageTimeToComplete: 12,
};

describe('AnalyticsCards', () => {
  it('renders all summary cards', () => {
    render(<AnalyticsCards summary={mockSummary} />);

    expect(screen.getByText('総調査数')).toBeInTheDocument();
    expect(screen.getByText('完了調査数')).toBeInTheDocument();
    expect(screen.getByText('総回答数')).toBeInTheDocument();
    expect(screen.getByText('平均完了率')).toBeInTheDocument();
    expect(screen.getByText('回答率')).toBeInTheDocument();
    expect(screen.getByText('平均回答時間')).toBeInTheDocument();
  });

  it('displays correct values', () => {
    render(<AnalyticsCards summary={mockSummary} />);

    expect(screen.getByText('12')).toBeInTheDocument(); // totalSurveys
    expect(screen.getByText('8')).toBeInTheDocument(); // completedSurveys
    expect(screen.getByText('1,247')).toBeInTheDocument(); // totalResponses (formatted)
    expect(screen.getByText('78.3%')).toBeInTheDocument(); // averageCompletionRate (formatted as percentage)
    expect(screen.getByText('85.2%')).toBeInTheDocument(); // responseRate (formatted as percentage)
    expect(screen.getByText('12分')).toBeInTheDocument(); // averageTimeToComplete (formatted with unit)
  });

  it('displays trend indicators', () => {
    render(<AnalyticsCards summary={mockSummary} />);

    // Check for trend indicators (arrows)
    expect(screen.getByText('↗')).toBeInTheDocument(); // up trend
    expect(screen.getByText('↘')).toBeInTheDocument(); // down trend
  });

  it('displays change percentages', () => {
    render(<AnalyticsCards summary={mockSummary} />);

    // Look for percentage changes
    expect(screen.getByText('+8.2%')).toBeInTheDocument();
    expect(screen.getByText('+12.5%')).toBeInTheDocument();
    expect(screen.getByText('+5.4%')).toBeInTheDocument();
    expect(screen.getByText('-2.1%')).toBeInTheDocument();
    expect(screen.getByText('+3.8%')).toBeInTheDocument();
    expect(screen.getByText('-5.2%')).toBeInTheDocument();
  });

  it('displays period labels', () => {
    render(<AnalyticsCards summary={mockSummary} />);

    expect(screen.getByText('(前月比)')).toBeInTheDocument();
    expect(screen.getByText('(前週比)')).toBeInTheDocument();
  });

  it('applies correct styling for different card types', () => {
    const { container } = render(<AnalyticsCards summary={mockSummary} />);

    // Check for different colored backgrounds
    expect(container.querySelector('.bg-blue-500')).toBeInTheDocument();
    expect(container.querySelector('.bg-green-500')).toBeInTheDocument();
    expect(container.querySelector('.bg-purple-500')).toBeInTheDocument();
    expect(container.querySelector('.bg-yellow-500')).toBeInTheDocument();
    expect(container.querySelector('.bg-indigo-500')).toBeInTheDocument();
    expect(container.querySelector('.bg-red-500')).toBeInTheDocument();
  });
});