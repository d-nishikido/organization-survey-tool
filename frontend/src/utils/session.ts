/**
 * Session management utilities for anonymous survey responses
 */

export interface SessionData {
  sessionToken: string;
  surveyId: number;
  expiresAt: string;
  createdAt: string;
}

export interface SurveyProgress {
  surveyId: number;
  sessionId: string;
  totalQuestions: number;
  answeredQuestions: number;
  progressPercentage: number;
  lastUpdated: string;
}

export interface ResponseData {
  questionId: number;
  answer: string | number | boolean | string[];
}

const SESSION_STORAGE_KEY = 'survey_session_data';
const PROGRESS_STORAGE_KEY = 'survey_progress_data';
const RESPONSES_STORAGE_KEY = 'survey_responses_data';

/**
 * Generate a browser fingerprint for duplicate prevention
 */
export function generateBrowserFingerprint(): Record<string, any> {
  try {
    return {
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.warn('Failed to generate browser fingerprint:', error);
    return {
      timestamp: Date.now(),
      fallback: true,
    };
  }
}

/**
 * Create a new anonymous session
 */
export async function createSession(surveyId: number): Promise<SessionData> {
  try {
    const fingerprint = generateBrowserFingerprint();
    
    const response = await fetch('/api/responses/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        survey_id: surveyId,
        fingerprint,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to create session');
    }

    const sessionData = await response.json();
    const session: SessionData = {
      sessionToken: sessionData.session_token,
      surveyId: sessionData.survey_id,
      expiresAt: sessionData.expires_at,
      createdAt: new Date().toISOString(),
    };

    // Store session data
    storeSessionData(session);
    
    return session;
  } catch (error) {
    console.error('Failed to create session:', error);
    throw error;
  }
}

/**
 * Get current session data
 */
export function getSessionData(): SessionData | null {
  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return null;

    const session: SessionData = JSON.parse(stored);
    
    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      clearSessionData();
      return null;
    }

    return session;
  } catch (error) {
    console.error('Failed to get session data:', error);
    clearSessionData();
    return null;
  }
}

/**
 * Store session data
 */
export function storeSessionData(session: SessionData): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Failed to store session data:', error);
  }
}

/**
 * Clear session data
 */
export function clearSessionData(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(PROGRESS_STORAGE_KEY);
    localStorage.removeItem(RESPONSES_STORAGE_KEY);
    sessionStorage.clear();
  } catch (error) {
    console.error('Failed to clear session data:', error);
  }
}

/**
 * Submit survey responses
 */
export async function submitResponses(
  surveyId: number, 
  sessionId: string, 
  responses: ResponseData[]
): Promise<{ success: boolean; responseId: string; submittedAt: string }> {
  try {
    const response = await fetch('/api/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        survey_id: surveyId,
        session_id: sessionId,
        responses,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to submit responses');
    }

    const result = await response.json();
    return {
      success: result.success,
      responseId: result.response_id,
      submittedAt: result.submitted_at,
    };
  } catch (error) {
    console.error('Failed to submit responses:', error);
    throw error;
  }
}

/**
 * Get survey progress
 */
export async function getSurveyProgress(sessionId: string, surveyId: number): Promise<SurveyProgress> {
  try {
    const response = await fetch(`/api/responses/progress?session_id=${sessionId}&survey_id=${surveyId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to get progress');
    }

    const progress = await response.json();
    
    // Store progress data
    storeProgressData(progress);
    
    return progress;
  } catch (error) {
    console.error('Failed to get survey progress:', error);
    throw error;
  }
}

/**
 * Complete survey session
 */
export async function completeSession(surveyId: number, sessionId: string): Promise<void> {
  try {
    const response = await fetch('/api/responses/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        survey_id: surveyId,
        session_id: sessionId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to complete session');
    }

    // Store completion data for the completion screen
    const completionData = {
      surveyId,
      sessionId,
      submittedAt: new Date().toISOString(),
    };
    
    localStorage.setItem('survey_completion', JSON.stringify(completionData));
    
  } catch (error) {
    console.error('Failed to complete session:', error);
    throw error;
  }
}

/**
 * Store progress data locally
 */
export function storeProgressData(progress: SurveyProgress): void {
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Failed to store progress data:', error);
  }
}

/**
 * Get stored progress data
 */
export function getStoredProgressData(): SurveyProgress | null {
  try {
    const stored = localStorage.getItem(PROGRESS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to get stored progress data:', error);
    return null;
  }
}

/**
 * Store responses data locally (for backup/recovery)
 */
export function storeResponsesData(responses: ResponseData[]): void {
  try {
    localStorage.setItem(RESPONSES_STORAGE_KEY, JSON.stringify(responses));
  } catch (error) {
    console.error('Failed to store responses data:', error);
  }
}

/**
 * Get stored responses data
 */
export function getStoredResponsesData(): ResponseData[] | null {
  try {
    const stored = localStorage.getItem(RESPONSES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to get stored responses data:', error);
    return null;
  }
}

/**
 * Validate session before submission
 */
export function validateSession(session: SessionData | null): boolean {
  if (!session) return false;
  
  // Check if session is expired
  if (new Date(session.expiresAt) < new Date()) {
    clearSessionData();
    return false;
  }
  
  // Check if session token is valid UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(session.sessionToken)) {
    clearSessionData();
    return false;
  }
  
  return true;
}

/**
 * Handle session errors
 */
export function handleSessionError(error: Error): void {
  console.error('Session error:', error);
  
  // Clear session data on certain errors
  if (error.message.includes('expired') || 
      error.message.includes('invalid') || 
      error.message.includes('locked')) {
    clearSessionData();
  }
  
  // You can add more error handling logic here
  // such as showing user-friendly error messages
}