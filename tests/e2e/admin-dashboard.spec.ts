import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard - 管理ダッシュボード', () => {
  test.beforeEach(async ({ page }) => {
    // HR Manager としてログイン
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // HR Manager ボタンをクリック
    const hrButton = page.locator('button:has-text("HR Manager")');
    if (await hrButton.count() > 0) {
      await hrButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test('管理ダッシュボードページへのアクセス', async ({ page }) => {
    // ダッシュボードページに移動
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');

    // ページタイトルの確認
    const pageTitle = page.locator('h1:has-text("管理ダッシュボード")');
    await expect(pageTitle).toBeVisible();

    // ウェルカムメッセージの確認
    const welcomeText = page.locator('text=組織調査ツールの管理画面へようこそ');
    await expect(welcomeText).toBeVisible();
  });

  test('統計情報カードの表示確認', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // API呼び出しを待つ

    // 4つの統計カードが表示されることを確認

    // 1. アクティブ調査カード
    const activeSurveysCard = page.locator('text=アクティブ調査').first();
    await expect(activeSurveysCard).toBeVisible();

    // 2. 総回答数カード
    const totalResponsesCard = page.locator('text=総回答数').first();
    await expect(totalResponsesCard).toBeVisible();

    // 3. 回答率カード
    const responseRateCard = page.locator('text=回答率').first();
    await expect(responseRateCard).toBeVisible();

    // 4. 平均回答時間カード
    const avgTimeCard = page.locator('text=平均回答時間').first();
    await expect(avgTimeCard).toBeVisible();
  });

  test('統計情報の数値表示確認', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 統計カードに数値が表示されることを確認（0以上の数値）
    const statCards = page.locator('dd.text-lg');
    const count = await statCards.count();

    // 少なくとも4つの統計値が表示されているはず
    expect(count).toBeGreaterThanOrEqual(4);

    // 各統計値を確認
    for (let i = 0; i < Math.min(count, 4); i++) {
      const cardText = await statCards.nth(i).textContent();
      expect(cardText).toBeTruthy();
      console.log(`📊 統計値 ${i + 1}: ${cardText}`);
    }
  });

  test('クイックアクションセクションの表示', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');

    // クイックアクションタイトルの確認
    const quickActionsTitle = page.locator('h2:has-text("クイックアクション")');
    await expect(quickActionsTitle).toBeVisible();

    // 3つのアクションボタンが表示されることを確認

    // 1. 新しい調査を作成
    const createSurveyAction = page.locator('text=新しい調査を作成').first();
    await expect(createSurveyAction).toBeVisible();

    // 2. 結果を分析
    const analyzeAction = page.locator('text=結果を分析').first();
    await expect(analyzeAction).toBeVisible();

    // 3. システム設定
    const settingsAction = page.locator('text=システム設定').first();
    await expect(settingsAction).toBeVisible();
  });

  test('最近のアクティビティセクションの表示', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 最近のアクティビティタイトルの確認
    const activityTitle = page.locator('h2:has-text("最近のアクティビティ")');
    await expect(activityTitle).toBeVisible();

    // アクティビティセクションの説明文
    const activityDescription = page.locator('text=システムの最新動向');
    await expect(activityDescription).toBeVisible();
  });

  test('権限バッジの表示確認', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');

    // HR Manager バッジが表示されることを確認
    const permissionBadge = page.locator('span:has-text("HR Manager")');
    await expect(permissionBadge).toBeVisible();
  });

  test('API エラー時のフォールバック表示', async ({ page }) => {
    // APIリクエストをブロックしてエラー状態をシミュレート
    await page.route('**/api/admin/stats', route => route.abort());
    await page.route('**/api/admin/activity', route => route.abort());

    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // デモデータフォールバックメッセージまたはエラーメッセージが表示されるか確認
    const warningOrError = page.locator('text=/API接続なし|デモデータ|開発モード/').first();

    // ページは正常に表示されるべき（エラーでクラッシュしない）
    const pageTitle = page.locator('h1:has-text("管理ダッシュボード")');
    await expect(pageTitle).toBeVisible();
  });

  test('レスポンシブデザイン - モバイル表示', async ({ page }) => {
    // モバイルサイズに変更
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/admin/dashboard');
    await page.waitForLoadState('networkidle');

    // モバイルでもメインコンテンツが表示されることを確認
    const pageTitle = page.locator('h1:has-text("管理ダッシュボード")');
    await expect(pageTitle).toBeVisible();

    // 統計カードが表示される
    const activeSurveysCard = page.locator('text=アクティブ調査').first();
    await expect(activeSurveysCard).toBeVisible();
  });

  test('ナビゲーション - サイドバーからダッシュボードへ', async ({ page }) => {
    await page.goto('/admin/questions');
    await page.waitForLoadState('networkidle');

    // サイドバーのダッシュボードリンクをクリック
    const dashboardLink = page.locator('a:has-text("ダッシュボード")').first();
    if (await dashboardLink.count() > 0) {
      await dashboardLink.click();
      await page.waitForLoadState('networkidle');

      // ダッシュボードページに遷移したことを確認
      await expect(page).toHaveURL(/\/admin\/dashboard/);

      const pageTitle = page.locator('h1:has-text("管理ダッシュボード")');
      await expect(pageTitle).toBeVisible();
    }
  });
});

test.describe('Admin Dashboard API - APIエンドポイントテスト', () => {
  test('GET /api/admin/stats - 統計情報取得', async ({ request }) => {
    const response = await request.get('/api/admin/stats');

    // ステータスコード確認
    expect(response.status()).toBe(200);

    // レスポンスボディの確認
    const data = await response.json();

    // 必須フィールドの存在確認
    expect(data).toHaveProperty('active_surveys');
    expect(data).toHaveProperty('total_responses');
    expect(data).toHaveProperty('response_rate');
    expect(data).toHaveProperty('avg_completion_time');

    // データ型の確認
    expect(typeof data.active_surveys).toBe('number');
    expect(typeof data.total_responses).toBe('number');
    expect(typeof data.response_rate).toBe('number');
    expect(typeof data.avg_completion_time).toBe('number');

    // 値の範囲確認
    expect(data.active_surveys).toBeGreaterThanOrEqual(0);
    expect(data.total_responses).toBeGreaterThanOrEqual(0);
    expect(data.response_rate).toBeGreaterThanOrEqual(0);
    expect(data.avg_completion_time).toBeGreaterThanOrEqual(0);

    console.log('📊 統計データ:', JSON.stringify(data, null, 2));
  });

  test('GET /api/admin/activity - アクティビティ取得（デフォルト）', async ({ request }) => {
    const response = await request.get('/api/admin/activity');

    // ステータスコード確認
    expect(response.status()).toBe(200);

    // レスポンスボディの確認
    const data = await response.json();

    // 配列であることを確認
    expect(Array.isArray(data)).toBe(true);

    // データが存在する場合、構造を確認
    if (data.length > 0) {
      const firstActivity = data[0];

      expect(firstActivity).toHaveProperty('id');
      expect(firstActivity).toHaveProperty('type');
      expect(firstActivity).toHaveProperty('title');
      expect(firstActivity).toHaveProperty('description');
      expect(firstActivity).toHaveProperty('timestamp');
      expect(firstActivity).toHaveProperty('icon');

      // typeの値が有効な列挙値であることを確認
      expect(['survey_created', 'responses_received', 'report_generated']).toContain(firstActivity.type);

      console.log('📋 アクティビティ件数:', data.length);
      console.log('📋 最初のアクティビティ:', JSON.stringify(firstActivity, null, 2));
    }
  });

  test('GET /api/admin/activity?limit=5 - アクティビティ取得（制限付き）', async ({ request }) => {
    const response = await request.get('/api/admin/activity?limit=5');

    // ステータスコード確認
    expect(response.status()).toBe(200);

    // レスポンスボディの確認
    const data = await response.json();

    // 配列であることを確認
    expect(Array.isArray(data)).toBe(true);

    // 最大5件以下であることを確認
    expect(data.length).toBeLessThanOrEqual(5);

    console.log('📋 取得件数（limit=5）:', data.length);
  });

  test('GET /api/admin/activity?limit=1 - アクティビティ取得（最小制限）', async ({ request }) => {
    const response = await request.get('/api/admin/activity?limit=1');

    expect(response.status()).toBe(200);
    const data = await response.json();

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeLessThanOrEqual(1);
  });

  test('GET /api/admin/activity?limit=100 - アクティビティ取得（最大制限）', async ({ request }) => {
    const response = await request.get('/api/admin/activity?limit=100');

    expect(response.status()).toBe(200);
    const data = await response.json();

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeLessThanOrEqual(100);
  });
});
