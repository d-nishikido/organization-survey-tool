import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLoading, useGlobalLoading } from '../useLoading';

describe('useLoading', () => {
  it('should initialize with all keys set to false', () => {
    const { result } = renderHook(() => useLoading(['key1', 'key2']));
    
    expect(result.current.isLoading('key1')).toBe(false);
    expect(result.current.isLoading('key2')).toBe(false);
    expect(result.current.isAnyLoading()).toBe(false);
    expect(result.current.loadingKeys).toEqual([]);
  });

  it('should manage loading state for default key', () => {
    const { result } = renderHook(() => useLoading());

    act(() => {
      result.current.startLoading();
    });
    
    expect(result.current.isLoading()).toBe(true);
    expect(result.current.isAnyLoading()).toBe(true);
    expect(result.current.loadingKeys).toContain('default');

    act(() => {
      result.current.stopLoading();
    });
    
    expect(result.current.isLoading()).toBe(false);
    expect(result.current.isAnyLoading()).toBe(false);
    expect(result.current.loadingKeys).toEqual([]);
  });

  it('should manage loading state for multiple keys', () => {
    const { result } = renderHook(() => useLoading());

    act(() => {
      result.current.startLoading('fetch');
      result.current.startLoading('submit');
    });
    
    expect(result.current.isLoading('fetch')).toBe(true);
    expect(result.current.isLoading('submit')).toBe(true);
    expect(result.current.isAnyLoading()).toBe(true);
    expect(result.current.loadingKeys).toContain('fetch');
    expect(result.current.loadingKeys).toContain('submit');

    act(() => {
      result.current.stopLoading('fetch');
    });
    
    expect(result.current.isLoading('fetch')).toBe(false);
    expect(result.current.isLoading('submit')).toBe(true);
    expect(result.current.isAnyLoading()).toBe(true);
    expect(result.current.loadingKeys).toEqual(['submit']);
  });

  it('should handle nested loading states with counting', () => {
    const { result } = renderHook(() => useLoading());

    act(() => {
      result.current.startLoading('api');
      result.current.startLoading('api'); // Start twice
    });
    
    expect(result.current.isLoading('api')).toBe(true);

    act(() => {
      result.current.stopLoading('api'); // Stop once
    });
    
    // Should still be loading because we started twice
    expect(result.current.isLoading('api')).toBe(true);

    act(() => {
      result.current.stopLoading('api'); // Stop second time
    });
    
    // Now it should be stopped
    expect(result.current.isLoading('api')).toBe(false);
  });

  it('should reset all loading states', () => {
    const { result } = renderHook(() => useLoading());

    act(() => {
      result.current.startLoading('key1');
      result.current.startLoading('key2');
      result.current.startLoading('key3');
    });
    
    expect(result.current.isAnyLoading()).toBe(true);
    expect(result.current.loadingKeys).toHaveLength(3);

    act(() => {
      result.current.resetLoading();
    });
    
    expect(result.current.isAnyLoading()).toBe(false);
    expect(result.current.loadingKeys).toEqual([]);
    expect(result.current.isLoading('key1')).toBe(false);
    expect(result.current.isLoading('key2')).toBe(false);
    expect(result.current.isLoading('key3')).toBe(false);
  });

  it('should return false for non-existent keys', () => {
    const { result } = renderHook(() => useLoading());
    
    expect(result.current.isLoading('nonexistent')).toBe(false);
  });

  it('should handle stopping loading for non-existent or already stopped keys', () => {
    const { result } = renderHook(() => useLoading());

    // Should not throw
    act(() => {
      result.current.stopLoading('nonexistent');
    });
    
    expect(result.current.isLoading('nonexistent')).toBe(false);

    // Start and stop, then stop again
    act(() => {
      result.current.startLoading('test');
    });
    
    act(() => {
      result.current.stopLoading('test');
    });
    
    act(() => {
      result.current.stopLoading('test'); // Stop again
    });
    
    expect(result.current.isLoading('test')).toBe(false);
  });
});

describe('useGlobalLoading', () => {
  beforeEach(() => {
    // Reset global state
    act(() => {
      const { result: result1 } = renderHook(() => useGlobalLoading());
      const { result: result2 } = renderHook(() => useGlobalLoading());
      
      // Clear any existing loading states
      while (result1.current.isGlobalLoading || result2.current.isGlobalLoading) {
        result1.current.setGlobalLoading(false);
      }
    });
  });

  it('should share loading state across multiple hooks', () => {
    const { result: result1 } = renderHook(() => useGlobalLoading());
    const { result: result2 } = renderHook(() => useGlobalLoading());

    expect(result1.current.isGlobalLoading).toBe(false);
    expect(result2.current.isGlobalLoading).toBe(false);

    act(() => {
      result1.current.setGlobalLoading(true);
    });

    // Both hooks should reflect the change
    expect(result1.current.isGlobalLoading).toBe(true);
    expect(result2.current.isGlobalLoading).toBe(true);

    act(() => {
      result2.current.setGlobalLoading(false);
    });

    // Both hooks should reflect the change
    expect(result1.current.isGlobalLoading).toBe(false);
    expect(result2.current.isGlobalLoading).toBe(false);
  });

  it('should handle multiple concurrent loading states', () => {
    const { result } = renderHook(() => useGlobalLoading());

    act(() => {
      result.current.setGlobalLoading(true); // First loading
      result.current.setGlobalLoading(true); // Second loading
    });

    expect(result.current.isGlobalLoading).toBe(true);

    act(() => {
      result.current.setGlobalLoading(false); // Stop first
    });

    // Should still be loading (one loading state remaining)
    expect(result.current.isGlobalLoading).toBe(true);

    act(() => {
      result.current.setGlobalLoading(false); // Stop second
    });

    // Now should be done loading
    expect(result.current.isGlobalLoading).toBe(false);
  });

  it('should not go below zero loading count', () => {
    const { result } = renderHook(() => useGlobalLoading());

    act(() => {
      result.current.setGlobalLoading(false); // Stop without starting
      result.current.setGlobalLoading(false); // Stop again
    });

    expect(result.current.isGlobalLoading).toBe(false);

    act(() => {
      result.current.setGlobalLoading(true);
    });

    expect(result.current.isGlobalLoading).toBe(true);

    act(() => {
      result.current.setGlobalLoading(false);
    });

    expect(result.current.isGlobalLoading).toBe(false);
  });
});