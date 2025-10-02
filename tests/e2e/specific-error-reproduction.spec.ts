import { test, expect } from '@playwright/test';

/**
 * 特定エラー再現テスト
 * Specific Error Reproduction Tests
 *
 * これらのテストは実際のユーザーが遭遇する「質問の取得に失敗しました」エラーを
 * 特定の条件下で再現することを目的としています。
 */

test.describe('質問取得エラーの特定的な再現テスト', () => {

  test('正常ログイン後のAPI障害による質問取得エラー', async ({ page }) => {
    // 1. 正常にログインできることを確認
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("HR Manager")');
    await page.waitForURL('**/admin');

    // 2. ログイン成功後にAPIエラーを発生させる
    await page.route('**/api/questions**', route => {
      route.abort('failed');  // Network failure simulation
    });

    // 3. 質問管理ページにアクセス
    await page.goto('/admin/questions');
    await page.waitForLoadState('networkidle');

    // 4. エラーメッセージが表示されることを確認
    const errorMessage = page.locator('text=質問の取得に失敗しました');
    await expect(errorMessage).toBeVisible({ timeout: 15000 });

    console.log('✅ SUCCESS: 質問取得エラーを再現できました');
  });

  test('サーバーエラー500によるエラー表示', async ({ page }) => {
    // 正常ログイン
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("HR Manager")');
    await page.waitForURL('**/admin');

    // サーバーエラーレスポンスを模擬
    await page.route('**/api/questions**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal Server Error'
        })
      });
    });

    await page.goto('/admin/questions');
    await page.waitForLoadState('networkidle');

    const errorMessage = page.locator('text=質問の取得に失敗しました');
    await expect(errorMessage).toBeVisible({ timeout: 15000 });

    console.log('✅ SUCCESS: サーバーエラー時の質問取得エラーを再現できました');
  });

  test('タイムアウトによるエラー表示', async ({ page }) => {
    // 正常ログイン
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("HR Manager")');
    await page.waitForURL('**/admin');

    // 長時間の遅延を発生させる
    await page.route('**/api/questions**', async route => {
      // 45秒遅延（クライアントのタイムアウト30秒より長い）
      await new Promise(resolve => setTimeout(resolve, 45000));
      route.continue();
    });

    await page.goto('/admin/questions');
    await page.waitForLoadState('networkidle');

    const errorMessage = page.locator('text=質問の取得に失敗しました');
    await expect(errorMessage).toBeVisible({ timeout: 50000 });

    console.log('✅ SUCCESS: タイムアウト時の質問取得エラーを再現できました');
  });

  test('フィルター操作中のAPIエラー', async ({ page }) => {
    // 正常ログインと初期データ読み込み
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("HR Manager")');
    await page.waitForURL('**/admin');
    await page.goto('/admin/questions');
    await page.waitForLoadState('networkidle');

    // 初期状態では正常に質問が読み込まれることを確認
    await page.waitForTimeout(2000);

    // フィルター操作のタイミングでAPIエラーを発生させる
    await page.route('**/api/questions**', route => {
      route.abort('failed');
    });

    // フィルター操作を実行
    const searchInput = page.locator('input[placeholder*="質問を検索"]');
    await searchInput.fill('テスト検索');

    // エラーメッセージが表示されることを確認
    const errorMessage = page.locator('text=質問の取得に失敗しました');
    await expect(errorMessage).toBeVisible({ timeout: 15000 });

    console.log('✅ SUCCESS: フィルター操作中の質問取得エラーを再現できました');
  });

  test('ページネーション中のAPIエラー', async ({ page }) => {
    // 正常ログインと初期データ読み込み
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("HR Manager")');
    await page.waitForURL('**/admin');
    await page.goto('/admin/questions');
    await page.waitForLoadState('networkidle');

    // 初期状態を確認
    await page.waitForTimeout(2000);

    // ページネーション操作時にAPIエラーを発生させる
    await page.route('**/api/questions**', route => {
      // ページ番号が含まれている場合のみエラーを発生
      if (route.request().url().includes('page=')) {
        route.abort('failed');
      } else {
        route.continue();
      }
    });

    // ページネーションがある場合のみテスト実行
    const paginationNext = page.locator('button:has-text("次のページ")');
    if (await paginationNext.isVisible()) {
      await paginationNext.click();

      const errorMessage = page.locator('text=質問の取得に失敗しました');
      await expect(errorMessage).toBeVisible({ timeout: 15000 });

      console.log('✅ SUCCESS: ページネーション中の質問取得エラーを再現できました');
    } else {
      console.log('ℹ️  INFO: ページネーションが利用できないため、テストをスキップしました');
    }
  });

  test('認証切れ状態での質問取得エラー', async ({ page }) => {
    // 正常ログイン
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("HR Manager")');
    await page.waitForURL('**/admin');

    // 認証切れを模擬（401エラー）
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

    await page.goto('/admin/questions');
    await page.waitForLoadState('networkidle');

    const errorMessage = page.locator('text=質問の取得に失敗しました');
    await expect(errorMessage).toBeVisible({ timeout: 15000 });

    console.log('✅ SUCCESS: 認証切れ時の質問取得エラーを再現できました');
  });

  test('不正なJSONレスポンスによるエラー', async ({ page }) => {
    // 正常ログイン
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("HR Manager")');
    await page.waitForURL('**/admin');

    // 不正なJSONレスポンスを模擬
    await page.route('**/api/questions**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: 'invalid json format { this is broken'
      });
    });

    await page.goto('/admin/questions');
    await page.waitForLoadState('networkidle');

    const errorMessage = page.locator('text=質問の取得に失敗しました');
    await expect(errorMessage).toBeVisible({ timeout: 15000 });

    console.log('✅ SUCCESS: 不正JSONによる質問取得エラーを再現できました');
  });

  test('予期しないレスポンス構造によるエラー', async ({ page }) => {
    // 正常ログイン
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("HR Manager")');
    await page.waitForURL('**/admin');

    // 予期しないレスポンス構造を模擬
    await page.route('**/api/questions**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          // 'data' フィールドが欠落
          questions: [],
          total: 0
        })
      });
    });

    await page.goto('/admin/questions');
    await page.waitForLoadState('networkidle');

    const errorMessage = page.locator('text=質問の取得に失敗しました');
    await expect(errorMessage).toBeVisible({ timeout: 15000 });

    console.log('✅ SUCCESS: 予期しないレスポンス構造による質問取得エラーを再現できました');
  });

  test('CORSエラーによる質問取得エラー', async ({ page }) => {
    // 正常ログイン
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("HR Manager")');
    await page.waitForURL('**/admin');

    // CORS エラーを模擬
    await page.route('**/api/questions**', route => {
      route.abort('failed');
    });

    await page.goto('/admin/questions');
    await page.waitForLoadState('networkidle');

    const errorMessage = page.locator('text=質問の取得に失敗しました');
    await expect(errorMessage).toBeVisible({ timeout: 15000 });

    console.log('✅ SUCCESS: CORSエラーによる質問取得エラーを再現できました');
  });
});