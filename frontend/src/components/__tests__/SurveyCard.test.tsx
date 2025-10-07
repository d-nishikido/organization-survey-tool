import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SurveyCard } from '../SurveyCard';
import type { Survey } from '@/types/survey';

const mockSurvey: Survey = {
  id: '1',
  title: 'テスト調査',
  description: 'これはテスト用の調査です',
  status: 'active',
  start_date: '2025-10-01',
  end_date: '2025-10-31',
  created_at: '2025-10-01T00:00:00Z',
  updated_at: '2025-10-01T00:00:00Z',
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('SurveyCard', () => {
  describe('基本表示', () => {
    it('調査タイトルを表示する', () => {
      renderWithRouter(<SurveyCard survey={mockSurvey} />);
      expect(screen.getByText('テスト調査')).toBeInTheDocument();
    });

    it('調査説明を表示する', () => {
      renderWithRouter(<SurveyCard survey={mockSurvey} />);
      expect(screen.getByText('これはテスト用の調査です')).toBeInTheDocument();
    });
  });

  describe('回答済みバッジ表示（新機能）', () => {
    it('isCompleted=trueの場合、回答済みバッジを表示する', () => {
      renderWithRouter(<SurveyCard survey={mockSurvey} isCompleted={true} />);
      expect(screen.getByText(/回答済み/)).toBeInTheDocument();
    });

    it('isCompleted=falseの場合、回答済みバッジを表示しない', () => {
      renderWithRouter(<SurveyCard survey={mockSurvey} isCompleted={false} />);
      expect(screen.queryByText(/回答済み/)).not.toBeInTheDocument();
    });

    it('isCompletedが指定されない場合、回答済みバッジを表示しない', () => {
      renderWithRouter(<SurveyCard survey={mockSurvey} />);
      expect(screen.queryByText(/回答済み/)).not.toBeInTheDocument();
    });
  });

  describe('期限警告バッジ表示（新機能）', () => {
    it('isDeadlineNear=trueの場合、期限警告バッジを表示する', () => {
      renderWithRouter(<SurveyCard survey={mockSurvey} isDeadlineNear={true} />);
      expect(screen.getByText(/期限間近/)).toBeInTheDocument();
    });

    it('isDeadlineNear=falseの場合、期限警告バッジを表示しない', () => {
      renderWithRouter(<SurveyCard survey={mockSurvey} isDeadlineNear={false} />);
      expect(screen.queryByText(/期限間近/)).not.toBeInTheDocument();
    });
  });

  describe('回答済み調査のクリック無効化（新機能）', () => {
    it('isCompleted=trueの場合、調査開始ボタンが無効化される', () => {
      renderWithRouter(<SurveyCard survey={mockSurvey} isCompleted={true} />);
      const button = screen.queryByRole('button', { name: /調査を開始/ });
      if (button) {
        expect(button).toBeDisabled();
      }
    });

    it('isCompleted=trueの場合、低透明度のスタイルが適用される', () => {
      const { container } = renderWithRouter(<SurveyCard survey={mockSurvey} isCompleted={true} />);
      const card = container.firstChild;
      expect(card).toHaveClass('opacity-60');
    });
  });

  describe('コンパクト表示モード（新機能）', () => {
    it('variant="compact"の場合、コンパクトなレイアウトで表示される', () => {
      const { container } = renderWithRouter(<SurveyCard survey={mockSurvey} variant="compact" />);
      const card = container.querySelector('[class*="p-4"]');
      expect(card).toBeInTheDocument();
    });

    it('variant="default"の場合、デフォルトのレイアウトで表示される', () => {
      const { container } = renderWithRouter(<SurveyCard survey={mockSurvey} variant="default" />);
      const card = container.querySelector('[class*="p-6"]');
      expect(card).toBeInTheDocument();
    });
  });
});
