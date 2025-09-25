import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { SurveyForm } from '../SurveyForm';
import { SurveyService } from '../../../api/services/surveyService';

// Mock the SurveyService
vi.mock('../../../api/services/surveyService');

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('SurveyForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <SurveyForm />
      </BrowserRouter>
    );
  };

  describe('Start Date Validation', () => {
    it('should allow today\'s date as start date', async () => {
      renderComponent();

      // Get today's date in YYYY-MM-DD format
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Get tomorrow's date for end date
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // Fill in required fields
      const titleInput = screen.getByLabelText('タイトル');
      fireEvent.change(titleInput, { target: { value: 'Test Survey' } });

      // Set start date to today
      const startDateInput = screen.getByLabelText('開始日');
      fireEvent.change(startDateInput, { target: { value: todayStr } });

      // Set end date to tomorrow
      const endDateInput = screen.getByLabelText('終了日');
      fireEvent.change(endDateInput, { target: { value: tomorrowStr } });

      // Click save button
      const saveButton = screen.getByText('保存');
      fireEvent.click(saveButton);

      // Should not show validation error for today's date
      await waitFor(() => {
        expect(screen.queryByText('開始日は今日以降の日付を選択してください')).not.toBeInTheDocument();
      });
    });

    it('should show error for past dates', async () => {
      renderComponent();

      // Get yesterday's date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      // Get tomorrow's date for end date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // Fill in required fields
      const titleInput = screen.getByLabelText('タイトル');
      fireEvent.change(titleInput, { target: { value: 'Test Survey' } });

      // Set start date to yesterday
      const startDateInput = screen.getByLabelText('開始日');
      fireEvent.change(startDateInput, { target: { value: yesterdayStr } });

      // Set end date to tomorrow
      const endDateInput = screen.getByLabelText('終了日');
      fireEvent.change(endDateInput, { target: { value: tomorrowStr } });

      // Click save button
      const saveButton = screen.getByText('保存');
      fireEvent.click(saveButton);

      // Should show validation error for past date
      await waitFor(() => {
        expect(screen.getByText('開始日は今日以降の日付を選択してください')).toBeInTheDocument();
      });
    });
  });

  describe('Draft Save Functionality', () => {
    it('should save survey as draft when clicking draft save button', async () => {
      const mockCreateSurvey = vi.spyOn(SurveyService, 'createSurvey').mockResolvedValue({
        data: {
          id: 1,
          title: 'Test Survey',
          status: 'draft',
          description: '',
          start_date: new Date().toISOString(),
          end_date: new Date().toISOString(),
          is_anonymous: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        success: true,
      });

      renderComponent();

      // Get today's date
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Get tomorrow's date
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // Fill in form fields
      const titleInput = screen.getByLabelText('タイトル');
      fireEvent.change(titleInput, { target: { value: 'Draft Survey' } });

      const descriptionInput = screen.getByLabelText('説明');
      fireEvent.change(descriptionInput, { target: { value: 'Test description' } });

      const startDateInput = screen.getByLabelText('開始日');
      fireEvent.change(startDateInput, { target: { value: todayStr } });

      const endDateInput = screen.getByLabelText('終了日');
      fireEvent.change(endDateInput, { target: { value: tomorrowStr } });

      // Click draft save button
      const draftSaveButton = screen.getByText('下書き保存');
      fireEvent.click(draftSaveButton);

      // Wait for the API call
      await waitFor(() => {
        expect(mockCreateSurvey).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Draft Survey',
            description: 'Test description',
            status: 'draft',
            is_anonymous: false,
          })
        );
      });

      // Should navigate after successful save
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/admin/surveys');
      });
    });

    it('should save survey with selected status when clicking save button', async () => {
      const mockCreateSurvey = vi.spyOn(SurveyService, 'createSurvey').mockResolvedValue({
        data: {
          id: 1,
          title: 'Test Survey',
          status: 'active',
          description: '',
          start_date: new Date().toISOString(),
          end_date: new Date().toISOString(),
          is_anonymous: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        success: true,
      });

      renderComponent();

      // Get dates
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // Fill in form fields
      fireEvent.change(screen.getByLabelText('タイトル'), { target: { value: 'Active Survey' } });
      fireEvent.change(screen.getByLabelText('開始日'), { target: { value: todayStr } });
      fireEvent.change(screen.getByLabelText('終了日'), { target: { value: tomorrowStr } });

      // Select active status
      const activeRadio = screen.getByLabelText('公開');
      fireEvent.click(activeRadio);

      // Click save button
      const saveButton = screen.getByText('保存');
      fireEvent.click(saveButton);

      // Wait for the API call
      await waitFor(() => {
        expect(mockCreateSurvey).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Active Survey',
            status: 'active',
          })
        );
      });
    });

    it('should show error message when save fails', async () => {
      vi.spyOn(SurveyService, 'createSurvey').mockRejectedValue(new Error('API Error'));

      renderComponent();

      // Fill minimum required fields
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      fireEvent.change(screen.getByLabelText('タイトル'), { target: { value: 'Test Survey' } });
      fireEvent.change(screen.getByLabelText('開始日'), { target: { value: todayStr } });
      fireEvent.change(screen.getByLabelText('終了日'), { target: { value: tomorrowStr } });

      // Click save button
      fireEvent.click(screen.getByText('保存'));

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('保存に失敗しました。再度お試しください。')).toBeInTheDocument();
      });
    });
  });
});