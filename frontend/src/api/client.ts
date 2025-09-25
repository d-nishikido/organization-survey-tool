import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError, ApiErrorCode } from './types';

class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    // Use empty baseURL to allow Vite proxy to handle /api routes
    this.baseURL = '';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Add timestamp to requests for tracking
        if (config.headers) {
          config.headers['X-Request-Time'] = new Date().toISOString();
        }

        // Add auth token if available
        const token = this.getAuthToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(this.handleError(error));
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Log response time in development
        if (import.meta.env.DEV) {
          const requestTime = response.config.headers?.['X-Request-Time'];
          if (requestTime) {
            const duration = Date.now() - new Date(requestTime as string).getTime();
            console.debug(`API ${response.config.method?.toUpperCase()} ${response.config.url}: ${duration}ms`);
          }
        }
        return response;
      },
      (error: AxiosError) => {
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private getAuthToken(): string | null {
    // Get token from localStorage or sessionStorage
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  }

  private handleError(error: AxiosError): ApiError {
    let errorCode: ApiErrorCode = ApiErrorCode.UNKNOWN_ERROR;
    let message = 'An unexpected error occurred';
    let statusCode = 500;
    let details = {};

    if (error.response) {
      // Server responded with error status
      statusCode = error.response.status;
      const responseData = error.response.data as any;
      
      switch (statusCode) {
        case 400:
          errorCode = ApiErrorCode.VALIDATION_ERROR;
          message = responseData?.message || 'Invalid request data';
          details = responseData?.errors || {};
          break;
        case 401:
          errorCode = ApiErrorCode.UNAUTHORIZED;
          message = 'Authentication required';
          // Clear invalid token
          this.clearAuthToken();
          break;
        case 403:
          errorCode = ApiErrorCode.FORBIDDEN;
          message = 'You do not have permission to perform this action';
          break;
        case 404:
          errorCode = ApiErrorCode.NOT_FOUND;
          message = responseData?.message || 'Resource not found';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          errorCode = ApiErrorCode.SERVER_ERROR;
          message = 'Server error. Please try again later';
          break;
        default:
          message = responseData?.message || message;
      }
    } else if (error.request) {
      // Request made but no response received
      if (error.code === 'ECONNABORTED') {
        errorCode = ApiErrorCode.TIMEOUT;
        message = 'Request timeout. Please check your connection';
      } else {
        errorCode = ApiErrorCode.NETWORK_ERROR;
        message = 'Network error. Please check your connection';
      }
    }

    return {
      code: errorCode,
      message,
      statusCode,
      details,
      timestamp: new Date().toISOString(),
    };
  }

  private clearAuthToken(): void {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
  }

  // HTTP methods
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }

  // Get the axios instance for advanced usage
  getInstance(): AxiosInstance {
    return this.client;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;