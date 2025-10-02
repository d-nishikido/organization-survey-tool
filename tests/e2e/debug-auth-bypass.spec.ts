import { test, expect } from '@playwright/test';

test.describe('認証バイパステスト', () => {
  test('認証なしルートで質問割り当て画面にアクセス', async ({ page }) => {
    // ネットワークエラーを監視
    page.on('pageerror', error => {
      console.log('Page error:', error.message);
    });

    page.on('console', msg => {
      console.log('Console:', msg.text());
    });

    // 認証なしルートにアクセス
    console.log('認証なしルートにアクセス: /debug/surveys/1/questions');
    await page.goto('/debug/surveys/1/questions');
    await page.waitForLoadState('networkidle');

    const title = await page.title();
    console.log('Page title:', title);

    const url = page.url();
    console.log('Current URL:', url);

    // ページの内容を確認
    const content = await page.content();
    console.log('Content length:', content.length);
    console.log('Has h1:', content.includes('<h1'));
    console.log('Has login redirect:', content.includes('ログイン'));

    // h1要素を探す
    const h1Count = await page.locator('h1').count();
    console.log('Number of h1 elements:', h1Count);

    if (h1Count > 0) {
      const h1Text = await page.locator('h1').first().textContent();
      console.log('H1 text:', h1Text);
    }

    // すべてのタイトル要素を探す
    const titleCount = await page.locator('h1, h2, h3').count();
    console.log('Number of title elements:', titleCount);

    if (titleCount > 0) {
      const titles = await page.locator('h1, h2, h3').allTextContents();
      console.log('All titles:', titles);
    }

    // デバッグ情報が表示されているか確認
    const hasDebugInfo = content.includes('デバッグ情報');
    console.log('Has debug info:', hasDebugInfo);

    // 最低限ページが読み込まれていることを確認
    expect(url).toContain('/debug/surveys/1/questions');
    expect(h1Count).toBeGreaterThan(0);
  });
});