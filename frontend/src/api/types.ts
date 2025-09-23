export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
  details?: Record<string, any>;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface RequestConfig {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export enum ApiErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface ApiRequestState<T = any> {
  data: T | null;
  error: ApiError | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}