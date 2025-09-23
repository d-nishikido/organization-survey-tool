import { ApiError, ApiErrorCode } from './types';

export class ErrorHandler {
  private static readonly MAX_RETRIES = 3;
  private static readonly BASE_DELAY = 1000; // 1 second

  /**
   * Get user-friendly error message based on error code
   */
  static getUserMessage(error: ApiError): string {
    switch (error.code) {
      case ApiErrorCode.NETWORK_ERROR:
        return 'ネットワークエラーが発生しました。接続を確認してください。';
      case ApiErrorCode.TIMEOUT:
        return 'リクエストがタイムアウトしました。もう一度お試しください。';
      case ApiErrorCode.UNAUTHORIZED:
        return 'ログインが必要です。';
      case ApiErrorCode.FORBIDDEN:
        return 'この操作を実行する権限がありません。';
      case ApiErrorCode.NOT_FOUND:
        return '要求されたリソースが見つかりませんでした。';
      case ApiErrorCode.VALIDATION_ERROR:
        return '入力内容に誤りがあります。確認してください。';
      case ApiErrorCode.SERVER_ERROR:
        return 'サーバーエラーが発生しました。しばらくしてからもう一度お試しください。';
      default:
        return error.message || '予期しないエラーが発生しました。';
    }
  }

  /**
   * Determine if error is retryable
   */
  static isRetryable(error: ApiError): boolean {
    return [
      ApiErrorCode.NETWORK_ERROR,
      ApiErrorCode.TIMEOUT,
      ApiErrorCode.SERVER_ERROR,
    ].includes(error.code as ApiErrorCode);
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  static getRetryDelay(attempt: number): number {
    return Math.min(
      this.BASE_DELAY * Math.pow(2, attempt - 1) + Math.random() * 1000,
      30000 // Max 30 seconds
    );
  }

  /**
   * Execute function with retry logic
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    options: {
      maxRetries?: number;
      onRetry?: (attempt: number, error: ApiError) => void;
    } = {}
  ): Promise<T> {
    const maxRetries = options.maxRetries ?? this.MAX_RETRIES;
    let lastError: ApiError | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as ApiError;

        if (!this.isRetryable(lastError) || attempt === maxRetries) {
          throw lastError;
        }

        if (options.onRetry) {
          options.onRetry(attempt, lastError);
        }

        const delay = this.getRetryDelay(attempt);
        await this.delay(delay);
      }
    }

    throw lastError;
  }

  /**
   * Format validation errors for display
   */
  static formatValidationErrors(details?: Record<string, any>): string[] {
    if (!details || typeof details !== 'object') {
      return [];
    }

    const errors: string[] = [];
    
    Object.entries(details).forEach(([field, error]) => {
      if (typeof error === 'string') {
        errors.push(`${field}: ${error}`);
      } else if (Array.isArray(error)) {
        error.forEach((e) => {
          if (typeof e === 'string') {
            errors.push(`${field}: ${e}`);
          }
        });
      } else if (error && typeof error === 'object' && 'message' in error) {
        errors.push(`${field}: ${error.message}`);
      }
    });

    return errors;
  }

  /**
   * Log error for debugging
   */
  static logError(error: ApiError, context?: string): void {
    if (import.meta.env.DEV) {
      console.group(`🔴 API Error${context ? `: ${context}` : ''}`);
      console.error('Code:', error.code);
      console.error('Message:', error.message);
      console.error('Status:', error.statusCode);
      if (error.details) {
        console.error('Details:', error.details);
      }
      console.error('Timestamp:', error.timestamp);
      console.groupEnd();
    }
  }

  /**
   * Show error notification (placeholder for actual notification system)
   */
  static showNotification(error: ApiError, type: 'error' | 'warning' = 'error'): void {
    const message = this.getUserMessage(error);
    
    // This would typically integrate with a notification system
    // For now, we'll just log it
    if (import.meta.env.DEV) {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }

    // Dispatch custom event that can be caught by notification system
    window.dispatchEvent(
      new CustomEvent('api-error', {
        detail: { error, message, type },
      })
    );
  }

  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default ErrorHandler;