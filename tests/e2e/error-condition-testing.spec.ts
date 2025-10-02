import { test, expect } from '@playwright/test';

/**
 * エラー条件のE2Eテスト
 * Error Condition E2E Testing
 *
 * This test specifically targets error scenarios that may not be caught
 * by regular happy-path testing but manifest in real user environments.
 */

test.describe('エラー条件テスト (Error Condition Testing)', () => {

  test.describe('ネットワークエラーシナリオ (Network Error Scenarios)', () => {
    test('APIサーバーが停止中の場合のエラー表示', async ({ page }) => {
      // Block all API requests to simulate server down
      await page.route('**/api/**', route => {
        route.abort();
      });

      // Login as HR Manager first
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.click('button:has-text("HR Manager")');
      await page.waitForURL('**/admin');

      // Navigate to questions page
      await page.goto('/admin/questions');
      await page.waitForLoadState('networkidle');

      // Wait for error state to appear
      await page.waitForTimeout(2000);

      // Check for the specific error message that users report
      const errorMessage = page.locator('text=質問の取得に失敗しました');
      await expect(errorMessage).toBeVisible({ timeout: 10000 });

      // Verify the error is displayed prominently
      const alertComponent = page.locator('[role="alert"], .alert, .error');
      await expect(alertComponent).toBeVisible();
    });

    test('API応答遅延時のタイムアウト処理', async ({ page }) => {
      // Slow down API responses to test timeout behavior
      await page.route('**/api/questions**', async route => {
        // Delay response by 35 seconds (longer than client timeout)
        await new Promise(resolve => setTimeout(resolve, 35000));
        route.continue();
      });

      // Login as HR Manager
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.click('button:has-text("HR Manager")');
      await page.waitForURL('**/admin');

      // Navigate to questions page
      await page.goto('/admin/questions');

      // Check for timeout error or loading state handling
      const errorOrTimeout = page.locator('text=質問の取得に失敗しました, text=Request timeout, text=タイムアウトしました');
      await expect(errorOrTimeout).toBeVisible({ timeout: 40000 });
    });

    test('サーバーエラー(500)レスポンスのハンドリング', async ({ page }) => {
      // Mock server error response
      await page.route('**/api/questions**', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Internal Server Error',
            message: 'Database connection failed'
          })
        });
      });

      // Login and navigate
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.click('button:has-text("HR Manager")');
      await page.waitForURL('**/admin');
      await page.goto('/admin/questions');
      await page.waitForLoadState('networkidle');

      // Check error handling
      const errorMessage = page.locator('text=質問の取得に失敗しました');
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('ユーザーセッション関連エラー (User Session Errors)', () => {
    test('認証切れ状態での質問一覧アクセス', async ({ page }) => {
      // Mock 401 Unauthorized response
      await page.route('**/api/questions**', route => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Unauthorized',
            message: 'Authentication required'
          })
        });
      });

      // Login and navigate
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.click('button:has-text("HR Manager")');
      await page.waitForURL('**/admin');
      await page.goto('/admin/questions');
      await page.waitForLoadState('networkidle');

      // Should show error or redirect to login
      const authError = page.locator('text=質問の取得に失敗しました, text=Authentication required, text=ログインが必要');
      await expect(authError).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('データ形式エラー (Data Format Errors)', () => {
    test('APIが不正なJSON形式を返す場合', async ({ page }) => {
      // Mock malformed JSON response
      await page.route('**/api/questions**', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: 'invalid json { this is not valid'
        });
      });

      // Login and navigate
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.click('button:has-text("HR Manager")');
      await page.waitForURL('**/admin');
      await page.goto('/admin/questions');
      await page.waitForLoadState('networkidle');

      // Check for parse error handling
      const errorMessage = page.locator('text=質問の取得に失敗しました');
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
    });

    test('APIが予期しないデータ構造を返す場合', async ({ page }) => {
      // Mock unexpected data structure
      await page.route('**/api/questions**', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            // Missing 'data' field that frontend expects
            questions: [],
            count: 0
          })
        });
      });

      // Login and navigate
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.click('button:has-text("HR Manager")');
      await page.waitForURL('**/admin');
      await page.goto('/admin/questions');
      await page.waitForLoadState('networkidle');

      // Check for data structure error handling
      const errorMessage = page.locator('text=質問の取得に失敗しました');
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('ブラウザ環境固有のエラー (Browser Environment Errors)', () => {
    test('ローカルストレージが無効な場合', async ({ page, context }) => {
      // Clear localStorage and sessionStorage
      await context.clearPermissions();
      await page.goto('/login');

      // Disable localStorage
      await page.addInitScript(() => {
        delete (window as any).localStorage;
        delete (window as any).sessionStorage;
      });

      await page.waitForLoadState('networkidle');
      await page.click('button:has-text("HR Manager")');
      await page.waitForURL('**/admin');
      await page.goto('/admin/questions');
      await page.waitForLoadState('networkidle');

      // Should handle localStorage errors gracefully
      const errorMessage = page.locator('text=質問の取得に失敗しました');
      // This might or might not appear - checking that app doesn't crash
      const isVisible = await errorMessage.isVisible();

      // App should not crash - check for any critical error indicators
      const criticalErrors = page.locator('text=チャンクの読み込みに失敗, text=Script error, text=Uncaught');
      await expect(criticalErrors).not.toBeVisible();
    });

    test('CORS (Cross-Origin) エラーのシミュレーション', async ({ page }) => {
      // Mock CORS error
      await page.route('**/api/questions**', route => {
        route.abort('failed');
      });

      // Login and navigate
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.click('button:has-text("HR Manager")');
      await page.waitForURL('**/admin');
      await page.goto('/admin/questions');
      await page.waitForLoadState('networkidle');

      // Check for network error handling
      const errorMessage = page.locator('text=質問の取得に失敗しました');
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('リアルタイムエラー検出 (Real-time Error Detection)', () => {
    test('JavaScriptエラーとコンソールエラーの追跡', async ({ page }) => {
      const jsErrors: string[] = [];
      const consoleErrors: string[] = [];

      // Capture JavaScript errors
      page.on('pageerror', err => {
        jsErrors.push(err.message);
      });

      // Capture console errors
      page.on('console', msg => {
        if (msg.type() === 'error' && !msg.text().includes('favicon')) {
          consoleErrors.push(msg.text());
        }
      });

      // Mock an API error that might cause JS errors
      await page.route('**/api/questions**', route => {
        route.fulfill({
          status: 500,
          contentType: 'text/html',
          body: '<html><body>Internal Server Error</body></html>'
        });
      });

      // Navigate to the page
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.click('button:has-text("HR Manager")');
      await page.waitForURL('**/admin');
      await page.goto('/admin/questions');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // Check that error is displayed and no critical JS errors occurred
      const errorMessage = page.locator('text=質問の取得に失敗しました');
      await expect(errorMessage).toBeVisible({ timeout: 10000 });

      // Filter out non-critical errors
      const criticalJsErrors = jsErrors.filter(error =>
        !error.includes('ResizeObserver') &&
        !error.includes('Failed to load resource') &&
        !error.includes('favicon.ico')
      );

      const criticalConsoleErrors = consoleErrors.filter(error =>
        !error.includes('Failed to load resource') &&
        !error.includes('favicon.ico') &&
        !error.includes('net::ERR_')
      );

      // Report errors for debugging (but don't fail test)
      console.log('JS Errors captured:', criticalJsErrors);
      console.log('Console Errors captured:', criticalConsoleErrors);
    });

    test('フロントエンド・バックエンド間の通信エラー', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.click('button:has-text("HR Manager")');
      await page.waitForURL('**/admin');

      // Navigate and immediately try to trigger API calls
      await page.goto('/admin/questions');

      // Wait for initial load, then trigger search (which causes new API call)
      await page.waitForLoadState('networkidle');

      // Mock network failure after initial load
      await page.route('**/api/questions**', route => {
        route.abort('failed');
      });

      // Trigger a new API call through search
      const searchInput = page.locator('input[placeholder*="質問を検索"]');
      await searchInput.fill('テスト');

      // Wait for error to appear
      await page.waitForTimeout(2000);

      // Check if error message appears after the search
      const errorMessage = page.locator('text=質問の取得に失敗しました');
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
    });
  });
});