import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { useDashboardData } from '../useDashboardData';
import { surveyService } from '@/api/services/surveyService';
import { sessionManager } from '@/utils/sessionManager';
import type { ReactNode } from 'react';

// Mock dependencies
vi.mock('@/api/services/surveyService');
vi.mock('@/utils/sessionManager');

describe('useDashboardData', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // Create a new QueryClient for each test
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const mockSurveysResponse = {
    data: [
      {
        id: 1,
        title: '従業員満足度調査',
        description: 'Q1従業員満足度調査',
        status: 'active',
        start_date: '2025-10-01',
        end_date: '2025-10-15',
      },
      {
        id: 2,
        title: 'エンゲージメント調査',
        description: 'Q1エンゲージメント調査',
        status: 'active',
        start_date: '2025-10-01',
        end_date: '2025-10-31',
      },
    ],
    total: 2,
    page: 1,
    limit: 10,
  };

  describe('調査データとセッション状態の統合', () => {
    it('APIから調査データを取得し、セッション状態と統合する', async () => {
      vi.mocked(surveyService.getSurveys).mockResolvedValue(mockSurveysResponse);
      vi.mocked(sessionManager.isCompleted).mockImplementation((id: string) => {
        return id === '1';
      });

      const { result } = renderHook(() => useDashboardData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.surveys).toHaveLength(2);
      expect(result.current.surveys[0].isCompleted).toBe(true);
      expect(result.current.surveys[1].isCompleted).toBe(false);
    });

    it('調査データが空の場合、空配列を返す', async () => {
      vi.mocked(surveyService.getSurveys).mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      });

      const { result } = renderHook(() => useDashboardData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.surveys).toEqual([]);
    });
  });

  describe('統計情報の計算', () => {
    it('全体調査数と回答済み調査数を正しく集計する', async () => {
      vi.mocked(surveyService.getSurveys).mockResolvedValue(mockSurveysResponse);
      vi.mocked(sessionManager.isCompleted).mockImplementation((id: string) => {
        return id === '1';
      });

      const { result } = renderHook(() => useDashboardData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.stats.totalSurveys).toBe(2);
      expect(result.current.stats.completedSurveys).toBe(1);
    });

    it('回答完了率を正しく計算する（パーセンテージ）', async () => {
      vi.mocked(surveyService.getSurveys).mockResolvedValue(mockSurveysResponse);
      vi.mocked(sessionManager.isCompleted).mockImplementation((id: string) => {
        return id === '1';
      });

      const { result } = renderHook(() => useDashboardData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.stats.completionRate).toBe(50);
    });

    it('調査が0件の場合、完了率は0%になる', async () => {
      vi.mocked(surveyService.getSurveys).mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      });

      const { result } = renderHook(() => useDashboardData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.stats.completionRate).toBe(0);
    });

    it('全ての調査が完了している場合、完了率は100%になる', async () => {
      vi.mocked(surveyService.getSurveys).mockResolvedValue(mockSurveysResponse);
      vi.mocked(sessionManager.isCompleted).mockReturnValue(true);

      const { result } = renderHook(() => useDashboardData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.stats.completionRate).toBe(100);
    });
  });

  describe('期限警告フラグの計算', () => {
    it('期限が3日以内の調査にisDeadlineNear=trueを設定する', async () => {
      const now = new Date();
      const nearDeadline = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days later

      const surveysWithNearDeadline = {
        data: [
          {
            id: 1,
            title: '緊急調査',
            description: '期限間近の調査',
            status: 'active',
            start_date: '2025-10-01',
            end_date: nearDeadline.toISOString().split('T')[0],
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      vi.mocked(surveyService.getSurveys).mockResolvedValue(surveysWithNearDeadline);
      vi.mocked(sessionManager.isCompleted).mockReturnValue(false);

      const { result } = renderHook(() => useDashboardData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.surveys[0].isDeadlineNear).toBe(true);
    });

    it('期限が3日より先の調査にisDeadlineNear=falseを設定する', async () => {
      const now = new Date();
      const farDeadline = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000); // 10 days later

      const surveysWithFarDeadline = {
        data: [
          {
            id: 1,
            title: '通常調査',
            description: '期限まで余裕がある調査',
            status: 'active',
            start_date: '2025-10-01',
            end_date: farDeadline.toISOString().split('T')[0],
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      vi.mocked(surveyService.getSurveys).mockResolvedValue(surveysWithFarDeadline);
      vi.mocked(sessionManager.isCompleted).mockReturnValue(false);

      const { result } = renderHook(() => useDashboardData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.surveys[0].isDeadlineNear).toBe(false);
    });

    it('期限が過ぎた調査にisDeadlineNear=falseを設定する', async () => {
      const now = new Date();
      const pastDeadline = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 days ago

      const surveysWithPastDeadline = {
        data: [
          {
            id: 1,
            title: '期限切れ調査',
            description: '期限が過ぎた調査',
            status: 'active',
            start_date: '2025-09-01',
            end_date: pastDeadline.toISOString().split('T')[0],
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
      };

      vi.mocked(surveyService.getSurveys).mockResolvedValue(surveysWithPastDeadline);
      vi.mocked(sessionManager.isCompleted).mockReturnValue(false);

      const { result } = renderHook(() => useDashboardData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.surveys[0].isDeadlineNear).toBe(false);
    });
  });

  describe('ローディング・エラーステートの処理', () => {
    it('データ取得中はisLoading=trueを返す', () => {
      vi.mocked(surveyService.getSurveys).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useDashboardData(), { wrapper });

      expect(result.current.isLoading).toBe(true);
    });

    it('データ取得完了後はisLoading=falseを返す', async () => {
      vi.mocked(surveyService.getSurveys).mockResolvedValue(mockSurveysResponse);
      vi.mocked(sessionManager.isCompleted).mockReturnValue(false);

      const { result } = renderHook(() => useDashboardData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('API障害時にエラーを返す', async () => {
      const error = new Error('API error');
      vi.mocked(surveyService.getSurveys).mockRejectedValue(error);

      const { result } = renderHook(() => useDashboardData(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.error).toEqual(error);
    });

    it('refetch関数が正しく動作する', async () => {
      vi.mocked(surveyService.getSurveys).mockResolvedValue(mockSurveysResponse);
      vi.mocked(sessionManager.isCompleted).mockReturnValue(false);

      const { result } = renderHook(() => useDashboardData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Change mock data
      const newMockData = {
        ...mockSurveysResponse,
        data: [mockSurveysResponse.data[0]],
        total: 1,
      };
      vi.mocked(surveyService.getSurveys).mockResolvedValue(newMockData);

      // Call refetch
      result.current.refetch();

      await waitFor(() => {
        expect(result.current.surveys).toHaveLength(1);
      });
    });
  });

  describe('React Queryキャッシュの動作', () => {
    it('同じクエリキー（dashboard-surveys）を使用する', async () => {
      vi.mocked(surveyService.getSurveys).mockResolvedValue(mockSurveysResponse);
      vi.mocked(sessionManager.isCompleted).mockReturnValue(false);

      const { result } = renderHook(() => useDashboardData(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify that surveyService was called with the correct params
      expect(surveyService.getSurveys).toHaveBeenCalledWith({ status: 'active' });
    });
  });
});
