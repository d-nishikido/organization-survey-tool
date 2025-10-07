import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SurveyCardList } from '../SurveyCardList';
import type { SurveyWithStatus } from '../SurveyCardList';

// Mock SurveyCard component
vi.mock('../../SurveyCard', () => ({
  SurveyCard: ({ survey, onClick, isCompleted }: any) => (
    <div
      data-testid={`survey-card-${survey.id}`}
      onClick={() => onClick?.(survey.id)}
      className={isCompleted ? 'completed' : 'pending'}
    >
      <h3>{survey.title}</h3>
      <p>{survey.description}</p>
    </div>
  ),
}));

describe('SurveyCardList', () => {
  const mockSurveys: SurveyWithStatus[] = [
    {
      id: '1',
      title: '従業員満足度調査',
      description: 'Q1従業員満足度調査',
      status: 'active',
      start_date: '2025-10-01',
      end_date: '2025-10-15',
      isCompleted: false,
      isDeadlineNear: true,
    },
    {
      id: '2',
      title: 'エンゲージメント調査',
      description: 'Q1エンゲージメント調査',
      status: 'active',
      start_date: '2025-10-01',
      end_date: '2025-10-31',
      isCompleted: true,
      isDeadlineNear: false,
    },
    {
      id: '3',
      title: 'ストレスチェック',
      description: '年次ストレスチェック',
      status: 'active',
      start_date: '2025-10-01',
      end_date: '2025-10-20',
      isCompleted: false,
      isDeadlineNear: false,
    },
  ];

  describe('レスポンシブグリッドレイアウト', () => {
    it('グリッドレイアウトで調査カードを表示する', () => {
      const { container } = render(<SurveyCardList surveys={mockSurveys} />);
      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
    });

    it('複数の調査カードを正しくレンダリングする', () => {
      render(<SurveyCardList surveys={mockSurveys} />);
      expect(screen.getByTestId('survey-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('survey-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('survey-card-3')).toBeInTheDocument();
    });

    it('各調査カードに正しいデータが渡される', () => {
      render(<SurveyCardList surveys={mockSurveys} />);
      expect(screen.getByText('従業員満足度調査')).toBeInTheDocument();
      expect(screen.getByText('エンゲージメント調査')).toBeInTheDocument();
      expect(screen.getByText('ストレスチェック')).toBeInTheDocument();
    });
  });

  describe('onSurveyClickコールバック', () => {
    it('調査カードクリック時にonSurveyClickが呼ばれる', () => {
      const handleClick = vi.fn();
      render(<SurveyCardList surveys={mockSurveys} onSurveyClick={handleClick} />);

      const surveyCard = screen.getByTestId('survey-card-1');
      fireEvent.click(surveyCard);

      expect(handleClick).toHaveBeenCalledWith('1', false);
    });

    it('回答済み調査クリック時に正しいisCompletedフラグが渡される', () => {
      const handleClick = vi.fn();
      render(<SurveyCardList surveys={mockSurveys} onSurveyClick={handleClick} />);

      const completedSurveyCard = screen.getByTestId('survey-card-2');
      fireEvent.click(completedSurveyCard);

      expect(handleClick).toHaveBeenCalledWith('2', true);
    });

    it('onSurveyClickが未定義の場合でもエラーにならない', () => {
      expect(() => {
        render(<SurveyCardList surveys={mockSurveys} />);
      }).not.toThrow();
    });
  });

  describe('ローディング状態', () => {
    it('loading=trueの場合、スケルトンUIを表示する', () => {
      render(<SurveyCardList surveys={[]} loading={true} />);
      const skeletons = screen.getAllByTestId('skeleton');
      expect(skeletons).toHaveLength(3);
    });

    it('スケルトンUIにanimateクラスが適用される', () => {
      render(<SurveyCardList surveys={[]} loading={true} />);
      const skeletons = screen.getAllByTestId('skeleton');
      skeletons.forEach((skeleton) => {
        expect(skeleton).toHaveClass('animate-pulse');
      });
    });

    it('loading=falseの場合、実際の調査カードを表示する', () => {
      render(<SurveyCardList surveys={mockSurveys} loading={false} />);
      expect(screen.getByTestId('survey-card-1')).toBeInTheDocument();
      expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
    });
  });

  describe('空状態の表示', () => {
    it('調査が0件の場合、空状態メッセージを表示する', () => {
      render(<SurveyCardList surveys={[]} />);
      expect(screen.getByText('現在、回答可能な調査はありません。')).toBeInTheDocument();
    });

    it('カスタム空状態メッセージを表示できる', () => {
      const customMessage = '未回答の調査はありません。';
      render(<SurveyCardList surveys={[]} emptyMessage={customMessage} />);
      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });

    it('空状態でも調査カードは表示されない', () => {
      render(<SurveyCardList surveys={[]} />);
      expect(screen.queryByTestId(/survey-card/)).not.toBeInTheDocument();
    });
  });

  describe('エッジケース', () => {
    it('調査が1件のみの場合でも正しく表示する', () => {
      const singleSurvey = [mockSurveys[0]];
      render(<SurveyCardList surveys={singleSurvey} />);
      expect(screen.getByTestId('survey-card-1')).toBeInTheDocument();
      expect(screen.queryByTestId('survey-card-2')).not.toBeInTheDocument();
    });

    it('大量の調査（50件）でも正しく表示する', () => {
      const manySurveys: SurveyWithStatus[] = Array.from({ length: 50 }, (_, i) => ({
        id: String(i + 1),
        title: `調査${i + 1}`,
        description: `説明${i + 1}`,
        status: 'active' as const,
        start_date: '2025-10-01',
        end_date: '2025-10-31',
        isCompleted: false,
        isDeadlineNear: false,
      }));

      render(<SurveyCardList surveys={manySurveys} />);
      expect(screen.getAllByTestId(/survey-card/)).toHaveLength(50);
    });

    it('loading=trueかつsurveys配列が空でもエラーにならない', () => {
      expect(() => {
        render(<SurveyCardList surveys={[]} loading={true} />);
      }).not.toThrow();
    });
  });

  describe('アクセシビリティ', () => {
    it('空状態メッセージが適切なコントラストで表示される', () => {
      render(<SurveyCardList surveys={[]} />);
      const emptyMessage = screen.getByText('現在、回答可能な調査はありません。');
      expect(emptyMessage).toHaveClass('text-gray-500');
    });

    it('グリッドコンテナに適切なgapが設定されている', () => {
      const { container } = render(<SurveyCardList surveys={mockSurveys} />);
      const gridContainer = container.querySelector('.grid');
      expect(gridContainer).toHaveClass('gap-6');
    });
  });
});
