export type UserRole = 'employee' | 'hr' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionId: string | null; // For anonymous sessions
}

export interface AuthActions {
  login: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  createAnonymousSession: () => void;
  clearSession: () => void;
}