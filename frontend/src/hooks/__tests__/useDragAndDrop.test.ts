import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDragAndDrop } from '../useDragAndDrop';

interface TestItem {
  id: number;
  name: string;
}

describe('useDragAndDrop', () => {
  const mockItems: TestItem[] = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
    { id: 3, name: 'Item 3' },
  ];

  const mockOnReorder = vi.fn();

  const defaultOptions = {
    items: mockItems,
    onReorder: mockOnReorder,
    getItemId: (item: TestItem) => item.id,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('初期状態', () => {
    it('draggedIndexとdragOverIndexがnullである', () => {
      const { result } = renderHook(() => useDragAndDrop(defaultOptions));
      
      expect(result.current.draggedIndex).toBeNull();
      expect(result.current.dragOverIndex).toBeNull();
    });
  });

  describe('handleDragStart', () => {
    it('draggedIndexを設定する', () => {
      const { result } = renderHook(() => useDragAndDrop(defaultOptions));
      
      const mockEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: vi.fn(),
        },
        currentTarget: {
          innerHTML: '<div>Test</div>',
        },
      } as unknown as React.DragEvent<HTMLElement>;

      act(() => {
        result.current.handleDragStart(mockEvent, 0);
      });

      expect(result.current.draggedIndex).toBe(0);
      expect(mockEvent.dataTransfer.effectAllowed).toBe('move');
    });
  });

  describe('handleDragOver', () => {
    it('dragOverIndexを設定する', () => {
      const { result } = renderHook(() => useDragAndDrop(defaultOptions));
      
      const mockEvent = {
        preventDefault: vi.fn(),
        dataTransfer: {
          dropEffect: '',
        },
      } as unknown as React.DragEvent<HTMLElement>;

      act(() => {
        result.current.handleDragOver(mockEvent, 1);
      });

      expect(result.current.dragOverIndex).toBe(1);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.dataTransfer.dropEffect).toBe('move');
    });
  });

  describe('handleDragLeave', () => {
    it('dragOverIndexをnullにリセットする', () => {
      const { result } = renderHook(() => useDragAndDrop(defaultOptions));
      
      const mockEvent = {
        preventDefault: vi.fn(),
        dataTransfer: {
          dropEffect: '',
        },
      } as unknown as React.DragEvent<HTMLElement>;

      act(() => {
        result.current.handleDragOver(mockEvent, 1);
      });
      
      expect(result.current.dragOverIndex).toBe(1);

      act(() => {
        result.current.handleDragLeave();
      });

      expect(result.current.dragOverIndex).toBeNull();
    });
  });

  describe('handleDrop', () => {
    it('アイテムを並び替えてonReorderを呼び出す', () => {
      const { result } = renderHook(() => useDragAndDrop(defaultOptions));
      
      // ドラッグ開始
      const dragStartEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: vi.fn(),
        },
        currentTarget: {
          innerHTML: '<div>Test</div>',
        },
      } as unknown as React.DragEvent<HTMLElement>;

      act(() => {
        result.current.handleDragStart(dragStartEvent, 0);
      });

      // ドロップ
      const dropEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.DragEvent<HTMLElement>;

      act(() => {
        result.current.handleDrop(dropEvent, 2);
      });

      expect(mockOnReorder).toHaveBeenCalledTimes(1);
      const reorderedItems = mockOnReorder.mock.calls[0][0];
      
      // Item 1が最後に移動
      expect(reorderedItems[0]).toEqual({ id: 2, name: 'Item 2' });
      expect(reorderedItems[1]).toEqual({ id: 3, name: 'Item 3' });
      expect(reorderedItems[2]).toEqual({ id: 1, name: 'Item 1' });

      expect(result.current.draggedIndex).toBeNull();
      expect(result.current.dragOverIndex).toBeNull();
    });

    it('同じ位置にドロップした場合、onReorderを呼び出さない', () => {
      const { result } = renderHook(() => useDragAndDrop(defaultOptions));
      
      const dragStartEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: vi.fn(),
        },
        currentTarget: {
          innerHTML: '<div>Test</div>',
        },
      } as unknown as React.DragEvent<HTMLElement>;

      act(() => {
        result.current.handleDragStart(dragStartEvent, 1);
      });

      const dropEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.DragEvent<HTMLElement>;

      act(() => {
        result.current.handleDrop(dropEvent, 1);
      });

      expect(mockOnReorder).not.toHaveBeenCalled();
    });

    it('draggedIndexがnullの場合、onReorderを呼び出さない', () => {
      const { result } = renderHook(() => useDragAndDrop(defaultOptions));
      
      const dropEvent = {
        preventDefault: vi.fn(),
      } as unknown as React.DragEvent<HTMLElement>;

      act(() => {
        result.current.handleDrop(dropEvent, 1);
      });

      expect(mockOnReorder).not.toHaveBeenCalled();
    });
  });

  describe('handleDragEnd', () => {
    it('draggedIndexとdragOverIndexをリセットする', () => {
      const { result } = renderHook(() => useDragAndDrop(defaultOptions));
      
      const mockEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: vi.fn(),
        },
        currentTarget: {
          innerHTML: '<div>Test</div>',
        },
      } as unknown as React.DragEvent<HTMLElement>;

      act(() => {
        result.current.handleDragStart(mockEvent, 0);
      });

      expect(result.current.draggedIndex).toBe(0);

      act(() => {
        result.current.handleDragEnd();
      });

      expect(result.current.draggedIndex).toBeNull();
      expect(result.current.dragOverIndex).toBeNull();
    });
  });

  describe('getDragStyles', () => {
    it('通常状態のスタイルを返す', () => {
      const { result } = renderHook(() => useDragAndDrop(defaultOptions));
      
      const styles = result.current.getDragStyles(0);
      
      expect(styles).toContain('cursor-move');
      expect(styles).toContain('transition-colors');
    });

    it('非アクティブ状態のスタイルを返す', () => {
      const { result } = renderHook(() => useDragAndDrop(defaultOptions));
      
      const styles = result.current.getDragStyles(0, true);
      
      expect(styles).toContain('opacity-50');
    });

    it('ドラッグ中のスタイルを返す', () => {
      const { result } = renderHook(() => useDragAndDrop(defaultOptions));
      
      const mockEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: vi.fn(),
        },
        currentTarget: {
          innerHTML: '<div>Test</div>',
        },
      } as unknown as React.DragEvent<HTMLElement>;

      act(() => {
        result.current.handleDragStart(mockEvent, 0);
      });

      const styles = result.current.getDragStyles(0);
      
      expect(styles).toContain('opacity-50');
    });

    it('ドラッグオーバー中のスタイルを返す', () => {
      const { result } = renderHook(() => useDragAndDrop(defaultOptions));
      
      const mockEvent = {
        preventDefault: vi.fn(),
        dataTransfer: {
          dropEffect: '',
        },
      } as unknown as React.DragEvent<HTMLElement>;

      act(() => {
        result.current.handleDragOver(mockEvent, 1);
      });

      const styles = result.current.getDragStyles(1);
      
      expect(styles).toContain('bg-blue-50');
    });

    it('非アクティブかつドラッグ中のスタイルを返す', () => {
      const { result } = renderHook(() => useDragAndDrop(defaultOptions));
      
      const mockEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: vi.fn(),
        },
        currentTarget: {
          innerHTML: '<div>Test</div>',
        },
      } as unknown as React.DragEvent<HTMLElement>;

      act(() => {
        result.current.handleDragStart(mockEvent, 0);
      });

      const styles = result.current.getDragStyles(0, true);
      
      // opacity-50は1回だけ含まれる（重複しない）
      const opacityCount = (styles.match(/opacity-50/g) || []).length;
      expect(opacityCount).toBe(1);
    });
  });
});
