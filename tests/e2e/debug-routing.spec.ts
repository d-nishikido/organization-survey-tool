import { test, expect } from '@playwright/test';

test.describe('ルーティングデバッグ', () => {
  test('質問割り当て画面のルーティングを確認', async ({ page }) => {
    // ネットワークエラーを監視
    page.on('pageerror', error => {
      console.log('Page error:', error.message);
    });

    page.on('console', msg => {
      console.log('Console:', msg.text());
    });

    // 1. ホームページにアクセス
    console.log('1. ホームページにアクセス');
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const homeTitle = await page.title();
    console.log('Home title:', homeTitle);

    // 2. 管理画面にアクセス
    console.log('2. 管理者ダッシュボードにアクセス');
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    const adminTitle = await page.title();
    console.log('Admin title:', adminTitle);

    // ページの内容を確認
    const adminContent = await page.content();
    console.log('Admin page has login elements:', adminContent.includes('ログイン'));
    console.log('Admin page has dashboard elements:', adminContent.includes('ダッシュボード'));

    // 3. 調査管理画面にアクセス
    console.log('3. 調査管理画面にアクセス');
    await page.goto('/admin/surveys');
    await page.waitForLoadState('networkidle');

    const surveysTitle = await page.title();
    console.log('Surveys title:', surveysTitle);

    // 4. 質問割り当て画面に直接アクセス
    console.log('4. 質問割り当て画面に直接アクセス');
    await page.goto('/admin/surveys/1/questions');
    await page.waitForLoadState('networkidle');

    const questionsTitle = await page.title();
    console.log('Questions title:', questionsTitle);

    // ページの内容を詳細に確認
    const questionsContent = await page.content();
    console.log('Questions page content length:', questionsContent.length);
    console.log('Questions page has h1:', questionsContent.includes('<h1'));
    console.log('Questions page has error:', questionsContent.includes('エラー') || questionsContent.includes('Error'));
    console.log('Questions page has login:', questionsContent.includes('ログイン'));

    // URLを確認
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // 基本的な要素を探す
    const hasAnyTitle = await page.locator('h1, h2, h3').count();
    console.log('Number of title elements found:', hasAnyTitle);

    if (hasAnyTitle > 0) {
      const titles = await page.locator('h1, h2, h3').allTextContents();
      console.log('Found titles:', titles);
    }

    // 最低限何かが表示されていることを確認
    expect(questionsContent.length).toBeGreaterThan(100);
  });

  test('デバッグルートが正しいコンポーネントを表示するか確認', async ({ page }) => {
    console.log('=== デバッグルート検証テスト ===');

    // Debug route should now load the REAL component after our fix
    console.log('5. デバッグルート /debug/surveys/1/questions にアクセス');
    await page.goto('/debug/surveys/1/questions');
    await page.waitForLoadState('networkidle');

    // Wait a bit more for React to render
    await page.waitForTimeout(2000);

    // Check what component loaded
    const hasSearchInput = await page.locator('input[placeholder="質問を検索..."]').isVisible();
    const hasYellowDebugBox = await page.locator('.bg-yellow-100').isVisible();
    const pageTitle = await page.locator('h1').textContent() || '';

    console.log('Page title:', pageTitle);
    console.log('Has search input (real component):', hasSearchInput);
    console.log('Has yellow debug box (debug component):', hasYellowDebugBox);

    // After the fix, debug route should load REAL component
    if (hasSearchInput && !hasYellowDebugBox) {
      console.log('✅ SUCCESS: Debug route loads real component after fix');
    } else if (hasYellowDebugBox && !hasSearchInput) {
      console.log('❌ FAILED: Debug route still loads debug component - fix not working');
    } else {
      console.log('❓ UNKNOWN: Unexpected component state');
      const content = await page.content();
      console.log('Page content preview:', content.substring(0, 500));
    }

    // The fix should make debug route load the real component
    expect(hasSearchInput).toBe(true);
    expect(hasYellowDebugBox).toBe(false);
    expect(pageTitle).toContain('質問割り当て');
    expect(pageTitle).not.toContain('デバッグ版');
  });
});