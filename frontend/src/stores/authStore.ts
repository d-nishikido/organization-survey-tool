import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, AuthActions, User } from '@/types/auth';

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      sessionId: null,

      // Actions
      login: (user: User) => {
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          sessionId: null // Clear anonymous session on login
        });
      },

      logout: () => {
        set({ 
          user: null, 
          isAuthenticated: false, 
          isLoading: false,
          sessionId: null 
        });
        // Clear persisted data
        localStorage.removeItem('auth-storage');
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      createAnonymousSession: () => {
        const sessionId = `anon_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        set({ 
          sessionId,
          user: null,
          isAuthenticated: false 
        });
      },

      clearSession: () => {
        set({ sessionId: null });
      },

    }),
    {
      name: 'auth-storage',
      // For demo purposes, persist authentication state
      // In production, this should be more restrictive for security
      partialize: (state) => ({
        sessionId: state.sessionId,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);