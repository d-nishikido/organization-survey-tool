import { useState, useCallback, useRef, useEffect } from 'react';
import { ApiError, ApiRequestState } from '@/api/types';
import { ErrorHandler } from '@/api/errorHandler';

interface UseApiRequestOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: ApiError) => void;
  retries?: number;
  retryDelay?: number;
  showErrorNotification?: boolean;
}

export function useApiRequest<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiRequestOptions = {}
): {
  execute: (...args: any[]) => Promise<T | undefined>;
  state: ApiRequestState<T>;
  reset: () => void;
  cancel: () => void;
} {
  const [state, setState] = useState<ApiRequestState<T>>({
    data: null,
    error: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Cancel any pending requests when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const execute = useCallback(
    async (...args: any[]): Promise<T | undefined> => {
      // Cancel any previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      setState({
        data: null,
        error: null,
        isLoading: true,
        isSuccess: false,
        isError: false,
      });

      try {
        let result: T;

        if (options.retries && options.retries > 0) {
          // Execute with retry logic
          result = await ErrorHandler.withRetry(
            () => apiFunction(...args),
            {
              maxRetries: options.retries,
              onRetry: (attempt, error) => {
                if (import.meta.env.DEV) {
                  console.log(`Retrying API call (attempt ${attempt}):`, error.message);
                }
              },
            }
          );
        } else {
          // Execute without retry
          result = await apiFunction(...args);
        }

        if (isMountedRef.current) {
          setState({
            data: result,
            error: null,
            isLoading: false,
            isSuccess: true,
            isError: false,
          });

          if (options.onSuccess) {
            options.onSuccess(result);
          }
        }

        return result;
      } catch (error) {
        const apiError = error as ApiError;

        if (isMountedRef.current) {
          setState({
            data: null,
            error: apiError,
            isLoading: false,
            isSuccess: false,
            isError: true,
          });

          if (options.showErrorNotification !== false) {
            ErrorHandler.showNotification(apiError);
          }

          if (options.onError) {
            options.onError(apiError);
          }

          ErrorHandler.logError(apiError, apiFunction.name);
        }

        return undefined;
      }
    },
    [apiFunction, options]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      isLoading: false,
      isSuccess: false,
      isError: false,
    });
  }, []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      isLoading: false,
    }));
  }, []);

  return {
    execute,
    state,
    reset,
    cancel,
  };
}