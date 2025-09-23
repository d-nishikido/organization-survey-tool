import React, { createContext, useContext, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { User, UserRole } from '@/types/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionId: string | null;
  login: (user: User) => void;
  logout: () => void;
  createAnonymousSession: () => void;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const {
    user,
    isAuthenticated,
    isLoading,
    sessionId,
    login,
    logout,
    createAnonymousSession,
  } = useAuthStore();

  // Initialize anonymous session if no user is logged in
  useEffect(() => {
    if (!isAuthenticated && !sessionId && !isLoading) {
      createAnonymousSession();
    }
  }, [isAuthenticated, sessionId, isLoading, createAnonymousSession]);

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  // Auto-logout on tab close for security (authenticated users only)
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleBeforeUnload = () => {
      // Only clear session, don't call logout to avoid API calls during page unload
      useAuthStore.getState().clearSession();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isAuthenticated]);

  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    sessionId,
    login,
    logout,
    createAnonymousSession,
    hasRole,
    hasAnyRole,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}