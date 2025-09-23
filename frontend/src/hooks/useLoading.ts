import { useState, useCallback, useRef } from 'react';

interface LoadingState {
  [key: string]: boolean;
}

export function useLoading(initialKeys: string[] = []): {
  isLoading: (key?: string) => boolean;
  isAnyLoading: () => boolean;
  startLoading: (key?: string) => void;
  stopLoading: (key?: string) => void;
  resetLoading: () => void;
  loadingKeys: string[];
} {
  const [loadingState, setLoadingState] = useState<LoadingState>(() => {
    const initial: LoadingState = {};
    initialKeys.forEach((key) => {
      initial[key] = false;
    });
    return initial;
  });

  const loadingCountRef = useRef<{ [key: string]: number }>({});

  const startLoading = useCallback((key: string = 'default') => {
    // Increment loading count for this key
    if (!loadingCountRef.current[key]) {
      loadingCountRef.current[key] = 0;
    }
    loadingCountRef.current[key]++;

    setLoadingState((prev) => ({
      ...prev,
      [key]: true,
    }));
  }, []);

  const stopLoading = useCallback((key: string = 'default') => {
    // Decrement loading count for this key
    if (loadingCountRef.current[key]) {
      loadingCountRef.current[key]--;
      
      // Only set loading to false if count reaches 0
      if (loadingCountRef.current[key] === 0) {
        setLoadingState((prev) => ({
          ...prev,
          [key]: false,
        }));
      }
    }
  }, []);

  const isLoading = useCallback(
    (key: string = 'default') => {
      return loadingState[key] || false;
    },
    [loadingState]
  );

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingState).some((loading) => loading);
  }, [loadingState]);

  const resetLoading = useCallback(() => {
    loadingCountRef.current = {};
    setLoadingState({});
  }, []);

  const loadingKeys = Object.keys(loadingState).filter(
    (key) => loadingState[key]
  );

  return {
    isLoading,
    isAnyLoading,
    startLoading,
    stopLoading,
    resetLoading,
    loadingKeys,
  };
}

// Global loading state hook for app-wide loading indicators
let globalLoadingCallbacks: Set<(loading: boolean) => void> = new Set();
let globalLoadingCount = 0;

export function useGlobalLoading(): {
  isGlobalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;
} {
  const [isGlobalLoading, setIsGlobalLoading] = useState(globalLoadingCount > 0);

  useCallback(() => {
    const callback = (loading: boolean) => {
      setIsGlobalLoading(loading);
    };

    globalLoadingCallbacks.add(callback);

    return () => {
      globalLoadingCallbacks.delete(callback);
    };
  }, []);

  const setGlobalLoading = useCallback((loading: boolean) => {
    if (loading) {
      globalLoadingCount++;
    } else {
      globalLoadingCount = Math.max(0, globalLoadingCount - 1);
    }

    const isLoading = globalLoadingCount > 0;
    globalLoadingCallbacks.forEach((callback) => callback(isLoading));
  }, []);

  return {
    isGlobalLoading,
    setGlobalLoading,
  };
}