import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '@/contexts/AuthContext';
import { SurveyListPage } from '../SurveyListPage';
import { SurveyService } from '@/api/services/surveyService';

// Mock the SurveyService
jest.mock('@/api/services/surveyService');
const mockSurveyService = SurveyService as jest.Mocked<typeof SurveyService>;

// Mock AuthContext
const mockAuthContext = {
  user: null,
  sessionId: 'test-session-123',
  login: jest.fn(),
  logout: jest.fn(),
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext}>
        {component}
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('SurveyListPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch active surveys only', async () => {
    const mockResponse = {
      data: [
        {
          id: 1,
          title: 'Test Active Survey',
          description: 'Test Description',
          status: 'active' as const,
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          is_anonymous: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          response_count: 0,
        }
      ],
      total: 1,
      page: 1,
      pageSize: 6,
    };

    mockSurveyService.getSurveys.mockResolvedValueOnce(mockResponse);

    renderWithProviders(<SurveyListPage />);

    // Wait for the component to load
    await waitFor(() => {
      expect(mockSurveyService.getSurveys).toHaveBeenCalledWith({
        page: 1,
        pageSize: 6,
        status: 'active'
      });
    });

    // Verify the survey is displayed
    expect(screen.getByText('Test Active Survey')).toBeInTheDocument();
  });

  it('should show empty state when no active surveys exist', async () => {
    const mockResponse = {
      data: [],
      total: 0,
      page: 1,
      pageSize: 6,
    };

    mockSurveyService.getSurveys.mockResolvedValueOnce(mockResponse);

    renderWithProviders(<SurveyListPage />);

    await waitFor(() => {
      expect(screen.getByText('調査がありません')).toBeInTheDocument();
      expect(screen.getByText('現在利用可能な調査はありません。')).toBeInTheDocument();
    });

    // Verify that getSurveys was called with active status
    expect(mockSurveyService.getSurveys).toHaveBeenCalledWith({
      page: 1,
      pageSize: 6,
      status: 'active'
    });
  });

  it('should show loading state initially', () => {
    mockSurveyService.getSurveys.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithProviders(<SurveyListPage />);

    expect(screen.getByText('利用可能な調査')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
  });

  it('should show error state when API fails', async () => {
    mockSurveyService.getSurveys.mockRejectedValueOnce(new Error('API Error'));

    renderWithProviders(<SurveyListPage />);

    await waitFor(() => {
      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
      expect(screen.getByText('調査の読み込みに失敗しました。')).toBeInTheDocument();
    });
  });
});