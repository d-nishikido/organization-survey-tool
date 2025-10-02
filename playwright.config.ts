import { defineConfig, devices } from '@playwright/test';

/**
 * Pre-commit時の高速テスト実行に最適化された設定
 * 重要なSmokeテストのみを実行し、コミット時間を短縮
 */
export default defineConfig({
  testDir: './tests/e2e',

  // Pre-commit時は並行実行で高速化
  fullyParallel: true,
  forbidOnly: !!process.env.CI,

  // 失敗時は即座に中断（コミット時間短縮）
  retries: 0,
  workers: 2, // 2つのワーカーで並行実行
  maxFailures: 3, // 3つ失敗したら即座に停止

  // レポート設定（Pre-commit時は最小限）
  reporter: [
    ['list'], // コンソール出力のみ
    ['html', { open: 'never' }] // HTMLレポートは生成するが自動で開かない
  ],

  use: {
    // ベースURL
    baseURL: 'http://localhost:5173',

    // Pre-commit時は高速化のため最小限の設定
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // タイムアウト設定
    actionTimeout: 15000, // Increased for error scenarios
    navigationTimeout: 30000,
  },

  // Pre-commit時はChromeのみで実行（高速化）
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        // ヘッドレスモードで高速実行
        headless: true,
      },
    },
    // モバイルテストはフルテスト時のみ実行
    // {
    //   name: 'mobile-chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],

  // Docker環境でのWebサーバー設定
  webServer: {
    command: 'docker compose up',
    url: 'http://localhost:5173',
    reuseExistingServer: true, // 既存サーバーを再利用（高速化）
    timeout: 60 * 1000, // 60秒でタイムアウト
    stdout: 'ignore', // ログ出力を抑制
    stderr: 'pipe',
  },

  // グローバル設定
  globalTimeout: 5 * 60 * 1000, // 5分でグローバルタイムアウト

  // テストファイルの検索パターン
  testMatch: [
    '**/debug-auth-bypass.spec.ts', // 認証バイパステスト
    '**/debug-routing.spec.ts', // ルーティングデバッグ
    '**/simple-question-assignment.spec.ts', // デバッグ用テスト
    '**/smoke.spec.ts', // 基本動作確認テスト
    '**/survey-response-flow.spec.ts', // 調査回答フローテスト
    '**/question-types.spec.ts', // 質問タイプ別テスト（rating_5含む）
    '**/anonymity-verification.spec.ts', // 匿名性確保テスト
    '**/survey-question-assignment.spec.ts', // 質問割り当て機能テスト
    '**/verify-real-component.spec.ts', // コンポーネント検証テスト
    // 将来追加予定のテスト
    // '**/login-redirect.spec.ts', // ログインリダイレクトテスト
    // '**/question-management.spec.ts', // 質問管理テスト
    // フルテスト時は以下も含める
    // '**/*.spec.ts',
    // '**/*.test.ts'
  ],

  // 期待値設定
  expect: {
    timeout: 10000, // アサーションタイムアウト (increased for error conditions)
    toHaveScreenshot: { threshold: 0.5 }, // スクリーンショット比較の閾値
  },
});