import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useApiRequest } from '../useApiRequest';
import { ApiError, ApiErrorCode } from '@/api/types';
import { ErrorHandler } from '@/api/errorHandler';

vi.mock('@/api/errorHandler', () => ({
  ErrorHandler: {
    showNotification: vi.fn(),
    logError: vi.fn(),
    withRetry: vi.fn((fn) => fn()),
  },
}));

describe('useApiRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with correct default state', () => {
    const mockApiFunction = vi.fn();
    const { result } = renderHook(() => useApiRequest(mockApiFunction));

    expect(result.current.state).toEqual({
      data: null,
      error: null,
      isLoading: false,
      isSuccess: false,
      isError: false,
    });
  });

  it('should execute API call successfully', async () => {
    const mockData = { id: 1, name: 'Test' };
    const mockApiFunction = vi.fn().mockResolvedValue(mockData);
    const onSuccess = vi.fn();

    const { result } = renderHook(() => 
      useApiRequest(mockApiFunction, { onSuccess })
    );

    await act(async () => {
      const data = await result.current.execute();
      expect(data).toEqual(mockData);
    });

    await waitFor(() => {
      expect(result.current.state).toEqual({
        data: mockData,
        error: null,
        isLoading: false,
        isSuccess: true,
        isError: false,
      });
      expect(onSuccess).toHaveBeenCalledWith(mockData);
    });
  });

  it('should handle API call failure', async () => {
    const mockError: ApiError = {
      code: ApiErrorCode.SERVER_ERROR,
      message: 'Server error',
      statusCode: 500,
      timestamp: new Date().toISOString(),
    };
    const mockApiFunction = vi.fn().mockRejectedValue(mockError);
    const onError = vi.fn();

    const { result } = renderHook(() => 
      useApiRequest(mockApiFunction, { onError })
    );

    await act(async () => {
      const data = await result.current.execute();
      expect(data).toBeUndefined();
    });

    await waitFor(() => {
      expect(result.current.state).toEqual({
        data: null,
        error: mockError,
        isLoading: false,
        isSuccess: false,
        isError: true,
      });
      expect(onError).toHaveBeenCalledWith(mockError);
      expect(ErrorHandler.showNotification).toHaveBeenCalledWith(mockError);
      expect(ErrorHandler.logError).toHaveBeenCalledWith(mockError, 'mockApiFunction');
    });
  });

  it('should set loading state during execution', async () => {
    const mockApiFunction = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve('data'), 100))
    );

    const { result } = renderHook(() => useApiRequest(mockApiFunction));

    expect(result.current.state.isLoading).toBe(false);

    act(() => {
      result.current.execute();
    });

    expect(result.current.state.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.state.isLoading).toBe(false);
    });
  });

  it('should reset state correctly', async () => {
    const mockApiFunction = vi.fn().mockResolvedValue('data');
    const { result } = renderHook(() => useApiRequest(mockApiFunction));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.state.data).toBe('data');

    act(() => {
      result.current.reset();
    });

    expect(result.current.state).toEqual({
      data: null,
      error: null,
      isLoading: false,
      isSuccess: false,
      isError: false,
    });
  });

  it('should cancel pending request', async () => {
    const mockApiFunction = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve('data'), 1000))
    );

    const { result } = renderHook(() => useApiRequest(mockApiFunction));

    act(() => {
      result.current.execute();
    });

    expect(result.current.state.isLoading).toBe(true);

    act(() => {
      result.current.cancel();
    });

    expect(result.current.state.isLoading).toBe(false);
  });

  it('should handle retry logic when configured', async () => {
    const mockApiFunction = vi.fn().mockResolvedValue('data');
    const mockWithRetry = vi.fn().mockImplementation((fn) => fn());
    (ErrorHandler.withRetry as any).mockImplementation(mockWithRetry);

    const { result } = renderHook(() => 
      useApiRequest(mockApiFunction, { retries: 3 })
    );

    await act(async () => {
      await result.current.execute();
    });

    expect(mockWithRetry).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        maxRetries: 3,
      })
    );
  });

  it('should pass arguments to API function', async () => {
    const mockApiFunction = vi.fn().mockResolvedValue('result');
    const { result } = renderHook(() => useApiRequest(mockApiFunction));

    await act(async () => {
      await result.current.execute('arg1', 'arg2', { key: 'value' });
    });

    expect(mockApiFunction).toHaveBeenCalledWith('arg1', 'arg2', { key: 'value' });
  });

  it('should not show notification when disabled', async () => {
    const mockError: ApiError = {
      code: ApiErrorCode.SERVER_ERROR,
      message: 'Server error',
      statusCode: 500,
      timestamp: new Date().toISOString(),
    };
    const mockApiFunction = vi.fn().mockRejectedValue(mockError);

    const { result } = renderHook(() => 
      useApiRequest(mockApiFunction, { showErrorNotification: false })
    );

    await act(async () => {
      await result.current.execute();
    });

    expect(ErrorHandler.showNotification).not.toHaveBeenCalled();
  });
});