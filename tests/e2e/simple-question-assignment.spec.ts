import { test, expect } from '@playwright/test';

test.describe('質問割り当て画面 - 基本動作確認', () => {
  test('質問割り当て画面にアクセスできる（デバッグルート）', async ({ page }) => {
    // デバッグルート経由で質問割り当て画面にアクセス（実際のコンポーネントが表示される）
    await page.goto('/debug/surveys/1/questions');

    // ページが読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // ページタイトルが表示されることを確認
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });

    // 実際のコンポーネントが表示されていることを確認
    const pageTitle = await page.locator('h1').textContent();
    console.log('Page title:', pageTitle);
    expect(pageTitle).toContain('質問割り当て');
    expect(pageTitle).not.toContain('デバッグ版');

    // 基本的な要素が存在することを確認
    const pageContent = await page.content();
    console.log('Page loaded successfully');

    // エラーがないことを確認
    const hasError = pageContent.includes('エラー') || pageContent.includes('Error');
    expect(hasError).toBeFalsy();
  });

  test('APIからデータを取得できる', async ({ page }) => {
    // ネットワークリクエストを監視
    let questionRequestMade = false;
    let surveyQuestionsRequestMade = false;

    page.on('request', request => {
      if (request.url().includes('/api/questions')) {
        questionRequestMade = true;
        console.log('Questions API request:', request.url());
      }
      if (request.url().includes('/api/surveys/1/questions')) {
        surveyQuestionsRequestMade = true;
        console.log('Survey questions API request:', request.url());
      }
    });

    // デバッグルート経由で質問割り当て画面にアクセス
    await page.goto('/debug/surveys/1/questions');
    await page.waitForLoadState('networkidle');

    // APIリクエストが発生したことを確認
    console.log('Questions API called:', questionRequestMade);
    console.log('Survey questions API called:', surveyQuestionsRequestMade);

    // 少なくとも一方のAPIが呼ばれていることを確認
    expect(questionRequestMade || surveyQuestionsRequestMade).toBeTruthy();
  });

  test('基本的なUI要素が表示される', async ({ page }) => {
    await page.goto('/debug/surveys/1/questions');
    await page.waitForLoadState('networkidle');

    // 長いタイムアウトで主要要素の表示を確認
    const titleExists = await page.locator('h1').isVisible({ timeout: 15000 });
    console.log('Title visible:', titleExists);

    if (titleExists) {
      // タイトルが表示されている場合、他の要素も確認
      const sectionExists = await page.locator('h2').isVisible({ timeout: 10000 });
      console.log('Sections visible:', sectionExists);
    }

    // 最低限ページが表示されていることを確認
    expect(titleExists).toBeTruthy();
  });

  test('実際のコンポーネントが表示されている（フィルター機能あり）', async ({ page }) => {
    await page.goto('/debug/surveys/1/questions');
    await page.waitForLoadState('networkidle');

    // 実際のコンポーネントの特徴である検索フィールドが表示されることを確認
    const hasSearchInput = await page.locator('input[placeholder="質問を検索..."]').isVisible({ timeout: 10000 });
    console.log('Has search input (real component feature):', hasSearchInput);

    // デバッグコンポーネントの特徴である黄色いボックスがないことを確認
    const hasDebugBox = await page.locator('.bg-yellow-100').isVisible();
    console.log('Has debug box (should be false):', hasDebugBox);

    expect(hasSearchInput).toBeTruthy();
    expect(hasDebugBox).toBeFalsy();
  });
});