import { describe, it, expect } from 'vitest';

// 状態管理のための型定義
interface SurveyQuestion {
  id: number;
  text: string;
  type: string;
  category: string;
  category_id: number;
  is_required: boolean;
  options?: string[];
  order_num?: number;
}

interface StateSnapshot {
  assignedQuestions: SurveyQuestion[];
  availableQuestions: SurveyQuestion[];
}

// 状態管理ヘルパー関数（テスト用に抽出）
const createStateManagement = () => {
  let assignedQuestions: SurveyQuestion[] = [];
  let availableQuestions: SurveyQuestion[] = [];

  const setAssignedQuestions = (questions: SurveyQuestion[]) => {
    assignedQuestions = questions;
  };

  const setAvailableQuestions = (questions: SurveyQuestion[]) => {
    availableQuestions = questions;
  };

  const saveStateSnapshot = (): StateSnapshot => ({
    assignedQuestions: [...assignedQuestions],
    availableQuestions: [...availableQuestions],
  });

  const restoreStateSnapshot = (snapshot: StateSnapshot): void => {
    assignedQuestions = snapshot.assignedQuestions;
    availableQuestions = snapshot.availableQuestions;
  };

  return {
    setAssignedQuestions,
    setAvailableQuestions,
    getAssignedQuestions: () => assignedQuestions,
    getAvailableQuestions: () => availableQuestions,
    saveStateSnapshot,
    restoreStateSnapshot,
  };
};

describe('State Management', () => {
  it('状態スナップショットを正確に保存する', () => {
    const state = createStateManagement();

    const assigned: SurveyQuestion[] = [
      { id: 1, text: 'Question 1', type: 'text', category: 'A', category_id: 1, is_required: true, order_num: 1 },
    ];
    const available: SurveyQuestion[] = [
      { id: 2, text: 'Question 2', type: 'text', category: 'B', category_id: 2, is_required: false },
    ];

    state.setAssignedQuestions(assigned);
    state.setAvailableQuestions(available);

    const snapshot = state.saveStateSnapshot();

    expect(snapshot.assignedQuestions).toEqual(assigned);
    expect(snapshot.availableQuestions).toEqual(available);
    expect(snapshot.assignedQuestions).not.toBe(assigned); // イミュータブル性確認
    expect(snapshot.availableQuestions).not.toBe(available); // イミュータブル性確認
  });

  it('スナップショットから状態を正確に復元する', () => {
    const state = createStateManagement();

    const originalAssigned: SurveyQuestion[] = [
      { id: 1, text: 'Question 1', type: 'text', category: 'A', category_id: 1, is_required: true, order_num: 1 },
    ];
    const originalAvailable: SurveyQuestion[] = [
      { id: 2, text: 'Question 2', type: 'text', category: 'B', category_id: 2, is_required: false },
    ];

    state.setAssignedQuestions(originalAssigned);
    state.setAvailableQuestions(originalAvailable);

    const snapshot = state.saveStateSnapshot();

    // 状態を変更
    state.setAssignedQuestions([]);
    state.setAvailableQuestions([]);

    // スナップショットから復元
    state.restoreStateSnapshot(snapshot);

    expect(state.getAssignedQuestions()).toEqual(originalAssigned);
    expect(state.getAvailableQuestions()).toEqual(originalAvailable);
  });

  it('複数の質問を含む状態を正確に保存・復元する', () => {
    const state = createStateManagement();

    const assigned: SurveyQuestion[] = [
      { id: 1, text: 'Question 1', type: 'text', category: 'A', category_id: 1, is_required: true, order_num: 1 },
      { id: 2, text: 'Question 2', type: 'multiple_choice', category: 'B', category_id: 2, is_required: false, order_num: 2 },
      { id: 3, text: 'Question 3', type: 'rating', category: 'C', category_id: 3, is_required: true, order_num: 3 },
    ];
    const available: SurveyQuestion[] = [
      { id: 4, text: 'Question 4', type: 'text', category: 'D', category_id: 4, is_required: false },
      { id: 5, text: 'Question 5', type: 'yes_no', category: 'E', category_id: 5, is_required: true },
    ];

    state.setAssignedQuestions(assigned);
    state.setAvailableQuestions(available);

    const snapshot = state.saveStateSnapshot();

    // 状態を大幅に変更
    state.setAssignedQuestions([{ id: 99, text: 'New Q', type: 'text', category: 'Z', category_id: 99, is_required: false }]);
    state.setAvailableQuestions([]);

    // 復元
    state.restoreStateSnapshot(snapshot);

    expect(state.getAssignedQuestions()).toEqual(assigned);
    expect(state.getAvailableQuestions()).toEqual(available);
    expect(state.getAssignedQuestions().length).toBe(3);
    expect(state.getAvailableQuestions().length).toBe(2);
  });
});
