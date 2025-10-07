import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SessionManager } from '../sessionManager';

describe('SessionManager', () => {
  let sessionManager: SessionManager;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    sessionManager = new SessionManager();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('markCompleted', () => {
    it('調査を完了済みとしてマークできる', () => {
      sessionManager.markCompleted('survey-1');
      expect(sessionManager.isCompleted('survey-1')).toBe(true);
    });

    it('同じ調査を複数回マークしても重複しない', () => {
      sessionManager.markCompleted('survey-1');
      sessionManager.markCompleted('survey-1');

      const sessions = sessionManager.getSessions();
      const survey1Sessions = sessions.filter(s => s.surveyId === 'survey-1');
      expect(survey1Sessions).toHaveLength(1);
    });

    it('複数の調査を完了済みとしてマークできる', () => {
      sessionManager.markCompleted('survey-1');
      sessionManager.markCompleted('survey-2');
      sessionManager.markCompleted('survey-3');

      expect(sessionManager.isCompleted('survey-1')).toBe(true);
      expect(sessionManager.isCompleted('survey-2')).toBe(true);
      expect(sessionManager.isCompleted('survey-3')).toBe(true);
    });

    it('完了日時が正しく記録される', () => {
      const beforeMark = new Date().getTime();
      sessionManager.markCompleted('survey-1');
      const afterMark = new Date().getTime();

      const sessions = sessionManager.getSessions();
      const session = sessions.find(s => s.surveyId === 'survey-1');

      expect(session).toBeDefined();
      const sessionTime = new Date(session!.lastAccessed).getTime();
      expect(sessionTime).toBeGreaterThanOrEqual(beforeMark);
      expect(sessionTime).toBeLessThanOrEqual(afterMark);
    });
  });

  describe('isCompleted', () => {
    it('完了済みの調査に対してtrueを返す', () => {
      sessionManager.markCompleted('survey-1');
      expect(sessionManager.isCompleted('survey-1')).toBe(true);
    });

    it('未完了の調査に対してfalseを返す', () => {
      expect(sessionManager.isCompleted('survey-unknown')).toBe(false);
    });

    it('completeフラグがfalseの調査に対してfalseを返す', () => {
      // Directly manipulate localStorage to set completed=false
      const sessions = [{ surveyId: 'survey-1', completed: false, lastAccessed: new Date().toISOString() }];
      localStorage.setItem('survey_completed_surveys', JSON.stringify(sessions));

      sessionManager = new SessionManager(); // Reload from localStorage
      expect(sessionManager.isCompleted('survey-1')).toBe(false);
    });
  });

  describe('getSessions', () => {
    it('空の配列を返す（初期状態）', () => {
      const sessions = sessionManager.getSessions();
      expect(sessions).toEqual([]);
    });

    it('保存されたセッション一覧を返す', () => {
      sessionManager.markCompleted('survey-1');
      sessionManager.markCompleted('survey-2');

      const sessions = sessionManager.getSessions();
      expect(sessions).toHaveLength(2);
      expect(sessions.map(s => s.surveyId)).toContain('survey-1');
      expect(sessions.map(s => s.surveyId)).toContain('survey-2');
    });

    it('LocalStorageから正しくデータを読み込む', () => {
      const testSessions = [
        { surveyId: 'survey-1', completed: true, lastAccessed: '2025-10-01T00:00:00Z' },
        { surveyId: 'survey-2', completed: true, lastAccessed: '2025-10-02T00:00:00Z' }
      ];
      localStorage.setItem('survey_completed_surveys', JSON.stringify(testSessions));

      sessionManager = new SessionManager();
      const sessions = sessionManager.getSessions();
      expect(sessions).toEqual(testSessions);
    });
  });

  describe('cleanup', () => {
    it('30日以上前のセッションを削除する', () => {
      const now = new Date();
      const old = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000); // 31 days ago
      const recent = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10 days ago

      const testSessions = [
        { surveyId: 'survey-old', completed: true, lastAccessed: old.toISOString() },
        { surveyId: 'survey-recent', completed: true, lastAccessed: recent.toISOString() }
      ];
      localStorage.setItem('survey_completed_surveys', JSON.stringify(testSessions));

      sessionManager = new SessionManager();
      sessionManager.cleanup();

      const sessions = sessionManager.getSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].surveyId).toBe('survey-recent');
    });

    it('30日以内のセッションは削除しない', () => {
      const now = new Date();
      const recent1 = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
      const recent2 = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);

      const testSessions = [
        { surveyId: 'survey-1', completed: true, lastAccessed: recent1.toISOString() },
        { surveyId: 'survey-2', completed: true, lastAccessed: recent2.toISOString() }
      ];
      localStorage.setItem('survey_completed_surveys', JSON.stringify(testSessions));

      sessionManager = new SessionManager();
      sessionManager.cleanup();

      const sessions = sessionManager.getSessions();
      expect(sessions).toHaveLength(2);
    });
  });

  describe('LocalStorageエラーハンドリング', () => {
    it('LocalStorage利用不可時にエラーをスローせず空配列を返す', () => {
      // Mock localStorage.getItem to throw an error
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('LocalStorage not available');
      });

      sessionManager = new SessionManager();
      const sessions = sessionManager.getSessions();
      expect(sessions).toEqual([]);

      vi.restoreAllMocks();
    });

    it('JSONパース失敗時に空配列を返す', () => {
      localStorage.setItem('survey_completed_surveys', 'invalid json');

      sessionManager = new SessionManager();
      const sessions = sessionManager.getSessions();
      expect(sessions).toEqual([]);
    });

    it('LocalStorage書き込み失敗時にエラーをスローしない', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('LocalStorage write failed');
      });

      expect(() => {
        sessionManager.markCompleted('survey-1');
      }).not.toThrow();

      vi.restoreAllMocks();
    });
  });

  describe('getSession', () => {
    it('指定した調査のセッション情報を返す', () => {
      sessionManager.markCompleted('survey-1');
      const session = sessionManager.getSession('survey-1');

      expect(session).toBeDefined();
      expect(session?.surveyId).toBe('survey-1');
      expect(session?.completed).toBe(true);
    });

    it('存在しない調査に対してundefinedを返す', () => {
      const session = sessionManager.getSession('survey-unknown');
      expect(session).toBeUndefined();
    });
  });
});
