import { describe, it, expect } from 'vitest';
import axios, { AxiosError } from 'axios';

// エラー判別ヘルパー関数（SurveyQuestionAssignment.tsxから抽出してテスト）
const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      // ネットワークエラー
      return 'ネットワークエラーが発生しました。接続を確認してください。';
    }
    
    const status = error.response.status;
    
    if (status === 404) {
      return '指定された調査または質問が見つかりません。';
    } else if (status === 422) {
      return 'この質問は既に割り当てられています。';
    } else if (status >= 400 && status < 500) {
      return 'リクエストが不正です。再度お試しください。';
    } else if (status >= 500) {
      return 'システムエラーが発生しました。しばらくしてから再度お試しください。';
    }
  }
  
  return '質問の割り当てに失敗しました。再度お試しください。';
};

describe('getErrorMessage', () => {
  it('ネットワークエラーの場合、適切なメッセージを返す', () => {
    const networkError: Partial<AxiosError> = {
      isAxiosError: true,
      response: undefined,
      message: 'Network Error',
    };

    const message = getErrorMessage(networkError);
    expect(message).toBe('ネットワークエラーが発生しました。接続を確認してください。');
  });

  it('404エラーの場合、適切なメッセージを返す', () => {
    const notFoundError: Partial<AxiosError> = {
      isAxiosError: true,
      response: {
        status: 404,
      } as any,
    };

    const message = getErrorMessage(notFoundError);
    expect(message).toBe('指定された調査または質問が見つかりません。');
  });

  it('422エラーの場合、適切なメッセージを返す', () => {
    const validationError: Partial<AxiosError> = {
      isAxiosError: true,
      response: {
        status: 422,
      } as any,
    };

    const message = getErrorMessage(validationError);
    expect(message).toBe('この質問は既に割り当てられています。');
  });

  it('400番台エラーの場合、適切なメッセージを返す', () => {
    const clientError: Partial<AxiosError> = {
      isAxiosError: true,
      response: {
        status: 400,
      } as any,
    };

    const message = getErrorMessage(clientError);
    expect(message).toBe('リクエストが不正です。再度お試しください。');
  });

  it('500番台エラーの場合、適切なメッセージを返す', () => {
    const serverError: Partial<AxiosError> = {
      isAxiosError: true,
      response: {
        status: 500,
      } as any,
    };

    const message = getErrorMessage(serverError);
    expect(message).toBe('システムエラーが発生しました。しばらくしてから再度お試しください。');
  });

  it('不明なエラーの場合、フォールバックメッセージを返す', () => {
    const unknownError = new Error('Unknown error');

    const message = getErrorMessage(unknownError);
    expect(message).toBe('質問の割り当てに失敗しました。再度お試しください。');
  });
});
