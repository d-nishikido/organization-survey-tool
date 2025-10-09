import { useState } from 'react';

interface UseDragAndDropOptions<T> {
  items: T[];
  onReorder: (reorderedItems: T[]) => void;
  getItemId: (item: T) => number;
}

interface UseDragAndDropReturn {
  draggedIndex: number | null;
  dragOverIndex: number | null;
  handleDragStart: (e: React.DragEvent<HTMLElement>, index: number) => void;
  handleDragOver: (e: React.DragEvent<HTMLElement>, index: number) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent<HTMLElement>, dropIndex: number) => void;
  handleDragEnd: () => void;
  getDragStyles: (index: number, isInactive?: boolean) => string;
}

/**
 * ドラッグ&ドロップ機能を提供するカスタムフック
 * @param options ドラッグ&ドロップのオプション
 * @returns ドラッグ&ドロップのハンドラーとスタイル
 */
export const useDragAndDrop = <T>({
  items,
  onReorder,
  getItemId,
}: UseDragAndDropOptions<T>): UseDragAndDropReturn => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // 新しい順序を計算
    const reorderedItems = [...items];
    const [draggedItem] = reorderedItems.splice(draggedIndex, 1);
    reorderedItems.splice(dropIndex, 0, draggedItem);

    // onReorderコールバックを呼び出す
    onReorder(reorderedItems);

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const getDragStyles = (index: number, isInactive = false): string => {
    const styles = [];

    if (isInactive) {
      styles.push('opacity-50');
    }

    if (draggedIndex === index) {
      styles.push('opacity-50');
    }

    if (dragOverIndex === index) {
      styles.push('bg-blue-50');
    }

    styles.push('cursor-move', 'transition-colors');

    return styles.filter(Boolean).join(' ');
  };

  return {
    draggedIndex,
    dragOverIndex,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
    getDragStyles,
  };
};
