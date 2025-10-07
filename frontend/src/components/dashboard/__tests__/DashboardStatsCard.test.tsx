import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardStatsCard } from '../DashboardStatsCard';

describe('DashboardStatsCard', () => {
  const mockStats = {
    totalSurveys: 10,
    completedSurveys: 7,
    completionRate: 70,
  };

  describe('統計情報の表示', () => {
    it('全体調査数を正しく表示する', () => {
      render(<DashboardStatsCard stats={mockStats} />);
      expect(screen.getByText(/10/)).toBeInTheDocument();
      expect(screen.getByText(/全体/)).toBeInTheDocument();
    });

    it('回答済み調査数を正しく表示する', () => {
      render(<DashboardStatsCard stats={mockStats} />);
      expect(screen.getByText(/7/)).toBeInTheDocument();
      expect(screen.getByText(/回答済み/)).toBeInTheDocument();
    });

    it('完了率をパーセンテージで表示する', () => {
      render(<DashboardStatsCard stats={mockStats} />);
      expect(screen.getByText(/70%/)).toBeInTheDocument();
    });
  });

  describe('ローディング状態', () => {
    it('loading=trueの場合、スケルトンUIを表示する', () => {
      render(<DashboardStatsCard stats={mockStats} loading={true} />);
      const skeletonElements = screen.getAllByTestId('skeleton');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });

    it('loading=falseの場合、実際のデータを表示する', () => {
      render(<DashboardStatsCard stats={mockStats} loading={false} />);
      expect(screen.getByText(/70%/)).toBeInTheDocument();
    });
  });

  describe('エッジケース', () => {
    it('調査が0件の場合でもエラーにならない', () => {
      const emptyStats = {
        totalSurveys: 0,
        completedSurveys: 0,
        completionRate: 0,
      };
      render(<DashboardStatsCard stats={emptyStats} />);
      expect(screen.getByText(/0%/)).toBeInTheDocument();
    });

    it('完了率が100%の場合、適切に表示する', () => {
      const completeStats = {
        totalSurveys: 5,
        completedSurveys: 5,
        completionRate: 100,
      };
      render(<DashboardStatsCard stats={completeStats} />);
      expect(screen.getByText(/100%/)).toBeInTheDocument();
    });
  });

  describe('レスポンシブデザイン', () => {
    it('適切なTailwindクラスでレイアウトされる', () => {
      const { container } = render(<DashboardStatsCard stats={mockStats} />);
      const cardElement = container.querySelector('[class*="rounded"]');
      expect(cardElement).toBeInTheDocument();
    });
  });
});
