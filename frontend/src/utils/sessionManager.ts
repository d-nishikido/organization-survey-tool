/**
 * SessionManager for tracking survey completion status
 * Uses LocalStorage to maintain anonymous survey completion state
 */

export interface SurveySession {
  surveyId: string;
  completed: boolean;
  lastAccessed: string; // ISO 8601 format
}

export class SessionManager {
  private readonly STORAGE_KEY = 'survey_completed_surveys';

  /**
   * Get all survey sessions from LocalStorage
   */
  getSessions(): SurveySession[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return [];

      const sessions = JSON.parse(data);
      if (!Array.isArray(sessions)) return [];

      return sessions;
    } catch (error) {
      console.warn('Failed to get survey sessions:', error);
      return [];
    }
  }

  /**
   * Mark a survey as completed
   */
  markCompleted(surveyId: string): void {
    try {
      const sessions = this.getSessions();
      const existingIndex = sessions.findIndex(s => s.surveyId === surveyId);

      if (existingIndex >= 0) {
        // Update existing session
        sessions[existingIndex].completed = true;
        sessions[existingIndex].lastAccessed = new Date().toISOString();
      } else {
        // Add new session
        sessions.push({
          surveyId,
          completed: true,
          lastAccessed: new Date().toISOString(),
        });
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.warn('Failed to mark survey as completed:', error);
    }
  }

  /**
   * Check if a survey is completed
   */
  isCompleted(surveyId: string): boolean {
    const sessions = this.getSessions();
    const session = sessions.find(s => s.surveyId === surveyId);
    return session?.completed === true;
  }

  /**
   * Get a specific survey session
   */
  getSession(surveyId: string): SurveySession | undefined {
    const sessions = this.getSessions();
    return sessions.find(s => s.surveyId === surveyId);
  }

  /**
   * Clean up sessions older than 30 days
   */
  cleanup(): void {
    try {
      const sessions = this.getSessions();
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const activeSessions = sessions.filter(session => {
        const lastAccessed = new Date(session.lastAccessed);
        return lastAccessed >= thirtyDaysAgo;
      });

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(activeSessions));
    } catch (error) {
      console.warn('Failed to cleanup old sessions:', error);
    }
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();
