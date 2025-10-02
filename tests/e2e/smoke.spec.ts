import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - 基本動作確認', () => {
  test('アプリケーションが起動し、ホームページが表示される', async ({ page }) => {
    await page.goto('/');

    // タイトルの確認
    await expect(page).toHaveTitle('Organization Survey Tool');

    // メインヘッダーの表示確認
    const header = page.locator('main h1:has-text("Organization Survey Tool")');
    await expect(header).toBeVisible();

    // ナビゲーションメニューの確認
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.getByRole('link', { name: 'ホーム' })).toBeVisible();
    await expect(page.getByRole('link', { name: '調査一覧' })).toBeVisible();
  });

  test('調査一覧ページへのナビゲーション', async ({ page }) => {
    await page.goto('/');

    // 調査一覧リンクをクリック
    await page.getByRole('link', { name: '調査一覧' }).click();

    // URLの確認
    await expect(page).toHaveURL('/surveys');

    // ページタイトルの確認
    await expect(page.locator('main h1')).toContainText('利用可能な調査');
  });

  test('ログインページへのナビゲーション', async ({ page }) => {
    await page.goto('/');

    // ログインボタンをクリック
    await page.getByRole('link', { name: 'ログイン' }).click();

    // URLの確認
    await expect(page).toHaveURL('/login');

    // ログインフォームの表示確認
    await expect(page.locator('h2')).toContainText('組織調査ツールにログイン');
  });

  test('フッターの匿名性保証メッセージが表示される', async ({ page }) => {
    await page.goto('/');

    // 匿名性に関するメッセージの確認
    const anonymityMessage = page.locator('text=/完全匿名|個人を特定する情報は一切収集されません/').first();
    await expect(anonymityMessage).toBeVisible();
  });

  test('レスポンシブデザインの確認（モバイル表示）', async ({ page }) => {
    // モバイルサイズに変更
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // モバイルでも主要要素が表示されることを確認
    await expect(page.locator('main h1:has-text("Organization Survey Tool")')).toBeVisible();
    await expect(page.getByRole('link', { name: 'ホーム' })).toBeVisible();
  });
});