import apiClient from '../client';
import { ApiResponse } from '../types';
import { User, LoginCredentials, AuthTokens } from '@/types/auth';

export class AuthService {
  private static readonly BASE_PATH = '/api/auth';

  /**
   * Login with credentials
   */
  static async login(credentials: LoginCredentials): Promise<ApiResponse<AuthTokens>> {
    const response = await apiClient.post<ApiResponse<AuthTokens>>(
      `${this.BASE_PATH}/login`,
      credentials
    );
    
    // Store tokens
    if (response.data.accessToken) {
      localStorage.setItem('auth_token', response.data.accessToken);
      if (response.data.refreshToken) {
        localStorage.setItem('refresh_token', response.data.refreshToken);
      }
    }
    
    return response;
  }

  /**
   * Login with Microsoft SSO
   */
  static async loginWithSSO(): Promise<ApiResponse<AuthTokens>> {
    // This would typically redirect to Microsoft login
    // For now, returning a placeholder
    return apiClient.get<ApiResponse<AuthTokens>>(`${this.BASE_PATH}/sso/microsoft`);
  }

  /**
   * Logout current user
   */
  static async logout(): Promise<ApiResponse<void>> {
    try {
      const response = await apiClient.post<ApiResponse<void>>(`${this.BASE_PATH}/logout`);
      return response;
    } finally {
      // Clear tokens regardless of API response
      this.clearTokens();
    }
  }

  /**
   * Refresh access token
   */
  static async refreshToken(): Promise<ApiResponse<AuthTokens>> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<ApiResponse<AuthTokens>>(
      `${this.BASE_PATH}/refresh`,
      { refreshToken }
    );

    // Update tokens
    if (response.data.accessToken) {
      localStorage.setItem('auth_token', response.data.accessToken);
      if (response.data.refreshToken) {
        localStorage.setItem('refresh_token', response.data.refreshToken);
      }
    }

    return response;
  }

  /**
   * Get current user profile
   */
  static async getCurrentUser(): Promise<ApiResponse<User>> {
    return apiClient.get<ApiResponse<User>>(`${this.BASE_PATH}/me`);
  }

  /**
   * Verify if user is authenticated
   */
  static async verifyAuth(): Promise<ApiResponse<{ authenticated: boolean; user?: User }>> {
    return apiClient.get<ApiResponse<{ authenticated: boolean; user?: User }>>(
      `${this.BASE_PATH}/verify`
    );
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(email: string): Promise<ApiResponse<void>> {
    return apiClient.post<ApiResponse<void>>(`${this.BASE_PATH}/reset-password/request`, {
      email,
    });
  }

  /**
   * Reset password with token
   */
  static async resetPassword(
    token: string,
    newPassword: string
  ): Promise<ApiResponse<void>> {
    return apiClient.post<ApiResponse<void>>(`${this.BASE_PATH}/reset-password/confirm`, {
      token,
      newPassword,
    });
  }

  /**
   * Clear stored authentication tokens
   */
  static clearTokens(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('refresh_token');
  }

  /**
   * Check if user has valid token
   */
  static hasToken(): boolean {
    return !!(localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token'));
  }

  /**
   * Get stored auth token
   */
  static getToken(): string | null {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  }
}

export default AuthService;