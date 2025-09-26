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
    actionTimeout: 10000,
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
    '**/smoke.spec.ts', // Pre-commit時はSmokeテストのみ
    '**/login-redirect.spec.ts', // ログインリダイレクトテスト
    // フルテスト時は以下も含める
    // '**/*.spec.ts',
    // '**/*.test.ts'
  ],

  // 期待値設定
  expect: {
    timeout: 5000, // アサーションタイムアウト
    toHaveScreenshot: { threshold: 0.5 }, // スクリーンショット比較の閾値
  },
});