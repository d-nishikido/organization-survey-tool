import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorHandler } from '../errorHandler';
import { ApiError, ApiErrorCode } from '../types';

describe('ErrorHandler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('getUserMessage', () => {
    it('should return appropriate Japanese message for each error code', () => {
      const testCases: Array<[ApiErrorCode, string]> = [
        [ApiErrorCode.NETWORK_ERROR, 'ネットワークエラーが発生しました。接続を確認してください。'],
        [ApiErrorCode.TIMEOUT, 'リクエストがタイムアウトしました。もう一度お試しください。'],
        [ApiErrorCode.UNAUTHORIZED, 'ログインが必要です。'],
        [ApiErrorCode.FORBIDDEN, 'この操作を実行する権限がありません。'],
        [ApiErrorCode.NOT_FOUND, '要求されたリソースが見つかりませんでした。'],
        [ApiErrorCode.VALIDATION_ERROR, '入力内容に誤りがあります。確認してください。'],
        [ApiErrorCode.SERVER_ERROR, 'サーバーエラーが発生しました。しばらくしてからもう一度お試しください。'],
      ];

      testCases.forEach(([code, expectedMessage]) => {
        const error: ApiError = {
          code,
          message: 'Original message',
          statusCode: 500,
          timestamp: new Date().toISOString(),
        };
        expect(ErrorHandler.getUserMessage(error)).toBe(expectedMessage);
      });
    });

    it('should return custom message for unknown error code', () => {
      const error: ApiError = {
        message: 'Custom error message',
        statusCode: 500,
        timestamp: new Date().toISOString(),
      };
      expect(ErrorHandler.getUserMessage(error)).toBe('Custom error message');
    });

    it('should return default message when no message provided', () => {
      const error: ApiError = {
        message: '',
        statusCode: 500,
        timestamp: new Date().toISOString(),
      };
      expect(ErrorHandler.getUserMessage(error)).toBe('予期しないエラーが発生しました。');
    });
  });

  describe('isRetryable', () => {
    it('should identify retryable errors correctly', () => {
      const retryableErrors = [
        ApiErrorCode.NETWORK_ERROR,
        ApiErrorCode.TIMEOUT,
        ApiErrorCode.SERVER_ERROR,
      ];

      retryableErrors.forEach((code) => {
        const error: ApiError = {
          code,
          message: 'Error',
          statusCode: 500,
          timestamp: new Date().toISOString(),
        };
        expect(ErrorHandler.isRetryable(error)).toBe(true);
      });
    });

    it('should identify non-retryable errors correctly', () => {
      const nonRetryableErrors = [
        ApiErrorCode.UNAUTHORIZED,
        ApiErrorCode.FORBIDDEN,
        ApiErrorCode.NOT_FOUND,
        ApiErrorCode.VALIDATION_ERROR,
      ];

      nonRetryableErrors.forEach((code) => {
        const error: ApiError = {
          code,
          message: 'Error',
          statusCode: 400,
          timestamp: new Date().toISOString(),
        };
        expect(ErrorHandler.isRetryable(error)).toBe(false);
      });
    });
  });

  describe('getRetryDelay', () => {
    it('should calculate exponential backoff correctly', () => {
      const delay1 = ErrorHandler.getRetryDelay(1);
      const delay2 = ErrorHandler.getRetryDelay(2);
      const delay3 = ErrorHandler.getRetryDelay(3);

      // Base delay is 1000ms, so delays should roughly double
      expect(delay1).toBeGreaterThanOrEqual(1000);
      expect(delay1).toBeLessThan(2000);
      
      expect(delay2).toBeGreaterThanOrEqual(2000);
      expect(delay2).toBeLessThan(5000);
      
      expect(delay3).toBeGreaterThanOrEqual(4000);
      expect(delay3).toBeLessThan(9000);
    });

    it('should not exceed maximum delay', () => {
      const delay = ErrorHandler.getRetryDelay(10);
      expect(delay).toBeLessThanOrEqual(30000);
    });
  });

  describe('withRetry', () => {
    it('should retry failed operations', async () => {
      const mockFn = vi.fn();
      const error: ApiError = {
        code: ApiErrorCode.NETWORK_ERROR,
        message: 'Network error',
        statusCode: 500,
        timestamp: new Date().toISOString(),
      };

      mockFn
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');

      const result = await ErrorHandler.withRetry(mockFn, { maxRetries: 3 });
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should not retry non-retryable errors', async () => {
      const mockFn = vi.fn();
      const error: ApiError = {
        code: ApiErrorCode.UNAUTHORIZED,
        message: 'Unauthorized',
        statusCode: 401,
        timestamp: new Date().toISOString(),
      };

      mockFn.mockRejectedValue(error);

      await expect(ErrorHandler.withRetry(mockFn)).rejects.toEqual(error);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry callback', async () => {
      const mockFn = vi.fn();
      const onRetry = vi.fn();
      const error: ApiError = {
        code: ApiErrorCode.NETWORK_ERROR,
        message: 'Network error',
        statusCode: 500,
        timestamp: new Date().toISOString(),
      };

      mockFn
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');

      await ErrorHandler.withRetry(mockFn, { maxRetries: 2, onRetry });
      
      expect(onRetry).toHaveBeenCalledWith(1, error);
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should throw after max retries', async () => {
      const mockFn = vi.fn();
      const error: ApiError = {
        code: ApiErrorCode.NETWORK_ERROR,
        message: 'Network error',
        statusCode: 500,
        timestamp: new Date().toISOString(),
      };

      mockFn.mockRejectedValue(error);

      await expect(
        ErrorHandler.withRetry(mockFn, { maxRetries: 2 })
      ).rejects.toEqual(error);
      
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('formatValidationErrors', () => {
    it('should format validation errors correctly', () => {
      const details = {
        email: 'Invalid email format',
        password: ['Too short', 'Must contain numbers'],
        username: { message: 'Already taken' },
      };

      const formatted = ErrorHandler.formatValidationErrors(details);
      
      expect(formatted).toContain('email: Invalid email format');
      expect(formatted).toContain('password: Too short');
      expect(formatted).toContain('password: Must contain numbers');
      expect(formatted).toContain('username: Already taken');
      expect(formatted).toHaveLength(4);
    });

    it('should handle empty or invalid details', () => {
      expect(ErrorHandler.formatValidationErrors()).toEqual([]);
      expect(ErrorHandler.formatValidationErrors(null as any)).toEqual([]);
      expect(ErrorHandler.formatValidationErrors('invalid' as any)).toEqual([]);
    });
  });

  describe('showNotification', () => {
    it('should dispatch custom event with error details', () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
      const error: ApiError = {
        code: ApiErrorCode.VALIDATION_ERROR,
        message: 'Validation failed',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      };

      ErrorHandler.showNotification(error, 'warning');

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'api-error',
          detail: expect.objectContaining({
            error,
            message: expect.any(String),
            type: 'warning',
          }),
        })
      );
    });
  });
});