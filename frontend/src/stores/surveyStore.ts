import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SurveyState, SurveyActions, SurveyProgress, SurveyResponse } from '@/types/survey';

type SurveyStore = SurveyState & SurveyActions;

export const useSurveyStore = create<SurveyStore>()(
  persist(
    (set) => ({
      // State
      currentSurvey: null,
      progress: {},
      isSubmitting: false,
      error: null,

      // Actions
      startSurvey: (surveyId: string, totalQuestions: number) => {
        const now = new Date();
        const newProgress: SurveyProgress = {
          surveyId,
          currentQuestionIndex: 0,
          totalQuestions,
          responses: {},
          isCompleted: false,
          startedAt: now,
          lastUpdated: now,
        };

        set((state) => ({
          currentSurvey: surveyId,
          progress: {
            ...state.progress,
            [surveyId]: newProgress,
          },
          error: null,
        }));
      },

      saveResponse: (surveyId: string, questionId: string, value: string | number) => {
        const response: SurveyResponse = {
          questionId,
          value,
          timestamp: new Date(),
        };

        set((state) => {
          const currentProgress = state.progress[surveyId];
          if (!currentProgress) return state;

          return {
            progress: {
              ...state.progress,
              [surveyId]: {
                ...currentProgress,
                responses: {
                  ...currentProgress.responses,
                  [questionId]: response,
                },
                lastUpdated: new Date(),
              },
            },
          };
        });
      },

      nextQuestion: (surveyId: string) => {
        set((state) => {
          const currentProgress = state.progress[surveyId];
          if (!currentProgress) return state;

          const nextIndex = Math.min(
            currentProgress.currentQuestionIndex + 1,
            currentProgress.totalQuestions - 1
          );

          return {
            progress: {
              ...state.progress,
              [surveyId]: {
                ...currentProgress,
                currentQuestionIndex: nextIndex,
                lastUpdated: new Date(),
              },
            },
          };
        });
      },

      previousQuestion: (surveyId: string) => {
        set((state) => {
          const currentProgress = state.progress[surveyId];
          if (!currentProgress) return state;

          const prevIndex = Math.max(currentProgress.currentQuestionIndex - 1, 0);

          return {
            progress: {
              ...state.progress,
              [surveyId]: {
                ...currentProgress,
                currentQuestionIndex: prevIndex,
                lastUpdated: new Date(),
              },
            },
          };
        });
      },

      completeSurvey: (surveyId: string) => {
        set((state) => {
          const currentProgress = state.progress[surveyId];
          if (!currentProgress) return state;

          return {
            currentSurvey: null,
            progress: {
              ...state.progress,
              [surveyId]: {
                ...currentProgress,
                isCompleted: true,
                lastUpdated: new Date(),
              },
            },
          };
        });
      },

      setSubmitting: (submitting: boolean) => {
        set({ isSubmitting: submitting });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearProgress: (surveyId: string) => {
        set((state) => {
          const { [surveyId]: removed, ...remainingProgress } = state.progress;
          return {
            progress: remainingProgress,
            currentSurvey: state.currentSurvey === surveyId ? null : state.currentSurvey,
          };
        });
      },
    }),
    {
      name: 'survey-storage',
      // Persist survey progress for recovery after browser refresh
      partialize: (state) => ({
        progress: state.progress,
        currentSurvey: state.currentSurvey,
      }),
    }
  )
);