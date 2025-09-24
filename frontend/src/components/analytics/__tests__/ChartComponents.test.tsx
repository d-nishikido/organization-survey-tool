import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ChartComponents from '../ChartComponents';

const mockData = {
  labels: ['1月', '2月', '3月', '4月'],
  datasets: [
    {
      label: '回答数',
      data: [120, 150, 180, 220],
      color: '#3B82F6',
    },
  ],
};

describe('ChartComponents', () => {
  it('renders line chart correctly', () => {
    render(
      <ChartComponents
        type="line"
        data={mockData}
        height={300}
      />
    );

    // Check if the chart container is rendered
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });

  it('renders bar chart correctly', () => {
    render(
      <ChartComponents
        type="bar"
        data={mockData}
        height={300}
      />
    );

    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });

  it('renders pie chart correctly', () => {
    render(
      <ChartComponents
        type="pie"
        data={mockData}
        height={300}
      />
    );

    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });

  it('renders area chart correctly', () => {
    render(
      <ChartComponents
        type="area"
        data={mockData}
        height={300}
      />
    );

    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });

  it('shows error message for unsupported chart type', () => {
    render(
      <ChartComponents
        type={'unsupported' as any}
        data={mockData}
        height={300}
      />
    );

    expect(screen.getByText('サポートされていないチャートタイプです')).toBeInTheDocument();
  });

  it('applies custom height correctly', () => {
    const { container } = render(
      <ChartComponents
        type="line"
        data={mockData}
        height={400}
      />
    );

    // Check if ResponsiveContainer has the correct height
    const chartContainer = container.querySelector('.recharts-responsive-container');
    expect(chartContainer).toHaveStyle({ height: '400px' });
  });
});