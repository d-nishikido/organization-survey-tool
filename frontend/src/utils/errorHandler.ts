/**
 * APIエラーハンドリングユーティリティ
 * 
 * APIエラーをユーザーフレンドリーなメッセージに変換します
 */

export interface ApiError {
  statusCode?: number;
  message?: string;
  error?: string;
  details?: Record<string, string[]>;
}

/**
 * APIエラーからユーザーフレンドリーなメッセージを取得
 */
export const getErrorMessage = (error: unknown): string => {
  // エラーがない場合
  if (!error) {
    return '予期しないエラーが発生しました';
  }

  // ApiError型の場合
  if (typeof error === 'object' && error !== null) {
    const apiError = error as ApiError;

    // ステータスコード別のメッセージ
    switch (apiError.statusCode) {
      case 400:
        return apiError.message || 'リクエストが不正です。入力内容を確認してください';
      
      case 404:
        return 'リソースが見つかりません';
      
      case 409:
        // コード重複エラー
        if (apiError.message?.includes('Code already exists') || 
            apiError.message?.includes('既に使用されている')) {
          return apiError.message;
        }
        return 'データの競合が発生しました';
      
      case 422:
        return apiError.message || 'データの検証に失敗しました';
      
      case 500:
        return 'サーバーエラーが発生しました。しばらく待ってから再試行してください';
      
      case 503:
        return 'サービスが一時的に利用できません。しばらく待ってから再試行してください';
      
      default:
        // カスタムメッセージがあれば優先
        if (apiError.message) {
          return apiError.message;
        }
        if (apiError.error) {
          return apiError.error;
        }
    }
  }

  // Errorオブジェクトの場合
  if (error instanceof Error) {
    return error.message || '予期しないエラーが発生しました';
  }

  // 文字列の場合
  if (typeof error === 'string') {
    return error;
  }

  return '予期しないエラーが発生しました';
};

/**
 * バリデーションエラーの詳細を取得
 */
export const getValidationErrors = (error: unknown): Record<string, string> | null => {
  if (typeof error === 'object' && error !== null) {
    const apiError = error as ApiError;
    
    if (apiError.details && typeof apiError.details === 'object') {
      // details内の配列を文字列に変換
      const validationErrors: Record<string, string> = {};
      
      for (const [field, messages] of Object.entries(apiError.details)) {
        if (Array.isArray(messages) && messages.length > 0) {
          validationErrors[field] = messages[0]; // 最初のエラーメッセージを使用
        }
      }
      
      return Object.keys(validationErrors).length > 0 ? validationErrors : null;
    }
  }
  
  return null;
};

/**
 * エラーが特定のステータスコードかチェック
 */
export const isErrorWithStatus = (error: unknown, statusCode: number): boolean => {
  if (typeof error === 'object' && error !== null) {
    const apiError = error as ApiError;
    return apiError.statusCode === statusCode;
  }
  return false;
};

/**
 * コード重複エラーかチェック
 */
export const isDuplicateCodeError = (error: unknown): boolean => {
  return isErrorWithStatus(error, 409);
};

/**
 * バリデーションエラーかチェック
 */
export const isValidationError = (error: unknown): boolean => {
  return isErrorWithStatus(error, 400) || isErrorWithStatus(error, 422);
};

/**
 * サーバーエラーかチェック
 */
export const isServerError = (error: unknown): boolean => {
  if (typeof error === 'object' && error !== null) {
    const apiError = error as ApiError;
    return apiError.statusCode !== undefined && apiError.statusCode >= 500;
  }
  return false;
};
