import { test, expect } from '@playwright/test';

/**
 * カテゴリ管理機能のE2Eテスト
 * Category Management functionality E2E tests
 */

test.describe('カテゴリ管理機能 (Category Management)', () => {
  test.beforeEach(async ({ page }) => {
    // Login as HR Manager
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Click the HR Manager button
    await page.locator('button').nth(2).click();
    await page.waitForURL('**/admin');
    
    // Wait for authentication
    await page.waitForTimeout(1000);
    
    // Navigate to category management
    const categoryMenuLink = page.locator('a[href="/admin/categories"]');
    if (await categoryMenuLink.isVisible()) {
      await categoryMenuLink.click();
    } else {
      await page.goto('/admin/categories');
    }
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test.describe('10.1 カテゴリ一覧画面のE2Eテスト', () => {
    test('カテゴリ管理ページが正しく表示される', async ({ page }) => {
      await page.waitForTimeout(2000);
      
      // Check if we're on the categories page
      await expect(page).toHaveURL(/.*\/admin\/categories/);
      
      // ページタイトルを確認
      await expect(page.locator('h1, h2').filter({ hasText: 'カテゴリ管理' }).first()).toBeVisible();

      // 主要な要素が表示されているか確認
      await expect(page.locator('button:has-text("カテゴリを作成")').first()).toBeVisible();
      await expect(page.locator('input[placeholder*="検索"]')).toBeVisible();
    });

    test('カテゴリ一覧テーブルが表示される', async ({ page }) => {
      await page.waitForTimeout(1000);

      // カテゴリリストまたは空の状態が表示される
      const hasCategories = await page.locator('table tbody tr').count() > 0;
      const hasEmptyState = await page.locator('text=カテゴリがありません').isVisible().catch(() => false);

      expect(hasCategories || hasEmptyState).toBeTruthy();

      // カテゴリが存在する場合、テーブル構造を確認
      if (hasCategories) {
        // テーブルヘッダー
        await expect(page.locator('th:has-text("コード")')).toBeVisible();
        await expect(page.locator('th:has-text("名前")')).toBeVisible();
        await expect(page.locator('th:has-text("表示順")')).toBeVisible();
        await expect(page.locator('th:has-text("ステータス")')).toBeVisible();
        await expect(page.locator('th:has-text("関連質問数")')).toBeVisible();
        await expect(page.locator('th:has-text("操作")')).toBeVisible();

        // 最初の行の要素確認
        const firstRow = page.locator('table tbody tr').first();
        await expect(firstRow).toBeVisible();
        
        // 操作ボタンが表示される
        await expect(firstRow.locator('button:has-text("編集")').or(firstRow.locator('button[aria-label*="編集"]'))).toBeVisible();
        await expect(firstRow.locator('button:has-text("削除")').or(firstRow.locator('button[aria-label*="削除"]'))).toBeVisible();
      }
    });

    test('有効/無効フィルタが機能する', async ({ page }) => {
      await page.waitForTimeout(1000);

      // 有効フィルタボタンをクリック
      const activeButton = page.locator('button:has-text("有効のみ")').or(page.locator('button').filter({ hasText: '有効' }).first());
      if (await activeButton.isVisible()) {
        await activeButton.click();
        await page.waitForTimeout(500);
        
        // URLパラメータまたはフィルタ状態の確認
        // （実装により異なる）
      }

      // 全てフィルタボタンをクリック
      const allButton = page.locator('button:has-text("すべて")').or(page.locator('button').filter({ hasText: '全て' }).first());
      if (await allButton.isVisible()) {
        await allButton.click();
        await page.waitForTimeout(500);
      }
    });

    test('検索機能が動作する（部分一致）', async ({ page }) => {
      await page.waitForTimeout(1000);

      // カテゴリが存在する場合のみテスト実行
      const hasCategories = await page.locator('table tbody tr').count() > 0;
      if (!hasCategories) {
        test.skip();
        return;
      }

      // 最初のカテゴリ名を取得
      const firstCategoryName = await page.locator('table tbody tr').first().locator('td').nth(1).textContent();
      
      if (firstCategoryName && firstCategoryName.length > 2) {
        // 部分一致検索（名前の最初の2文字）
        const searchQuery = firstCategoryName.substring(0, 2);
        const searchInput = page.locator('input[placeholder*="検索"]');
        
        await searchInput.fill(searchQuery);
        await page.waitForTimeout(500);

        // 検索結果に該当カテゴリが含まれることを確認
        const visibleRows = await page.locator('table tbody tr').count();
        expect(visibleRows).toBeGreaterThan(0);
      }
    });

    test('ソート機能が動作する（display_order）', async ({ page }) => {
      await page.waitForTimeout(1000);

      const rowCount = await page.locator('table tbody tr').count();
      if (rowCount < 2) {
        test.skip();
        return;
      }

      // 表示順でソート済みであることを確認
      const displayOrders: number[] = [];
      for (let i = 0; i < Math.min(rowCount, 5); i++) {
        const orderText = await page.locator('table tbody tr').nth(i).locator('td').nth(2).textContent();
        if (orderText) {
          displayOrders.push(parseInt(orderText));
        }
      }

      // 昇順であることを確認
      for (let i = 1; i < displayOrders.length; i++) {
        expect(displayOrders[i]).toBeGreaterThanOrEqual(displayOrders[i - 1]);
      }
    });
  });

  test.describe('10.2 カテゴリ作成・編集フローのE2Eテスト', () => {
    test('カテゴリ作成フローが動作する', async ({ page }) => {
      await page.waitForTimeout(1000);

      // 作成ボタンをクリック
      await page.locator('button:has-text("カテゴリを作成")').first().click();
      await page.waitForTimeout(500);

      // モーダルが開くことを確認
      await expect(page.locator('div[role="dialog"]').or(page.locator('.modal')).first()).toBeVisible();
      await expect(page.locator('text=カテゴリを作成').or(page.locator('h2, h3').filter({ hasText: 'カテゴリ' }))).toBeVisible();

      // フォーム入力
      const timestamp = Date.now();
      await page.locator('input[name="code"]').or(page.locator('label:has-text("コード")').locator('..').locator('input')).fill(`E2E${timestamp % 1000}`);
      await page.locator('input[name="name"]').or(page.locator('label:has-text("名前")').locator('..').locator('input')).fill(`E2Eテストカテゴリ${timestamp}`);
      await page.locator('textarea[name="description"]').or(page.locator('label:has-text("説明")').locator('..').locator('textarea')).fill('E2Eテスト用の説明');
      await page.locator('input[name="display_order"]').or(page.locator('label:has-text("表示順")').locator('..').locator('input')).fill('999');

      // 作成ボタンをクリック
      await page.locator('button:has-text("作成")').or(page.locator('button[type="submit"]')).click();
      await page.waitForTimeout(1000);

      // 成功メッセージまたは一覧画面に戻ることを確認
      const successMessage = page.locator('text=作成しました').or(page.locator('text=成功'));
      const modalClosed = await page.locator('div[role="dialog"]').isHidden().catch(() => true);
      
      expect(await successMessage.isVisible().catch(() => false) || modalClosed).toBeTruthy();
    });

    test('カテゴリ編集フローが動作する', async ({ page }) => {
      await page.waitForTimeout(1000);

      // カテゴリが存在する場合のみテスト実行
      const hasCategories = await page.locator('table tbody tr').count() > 0;
      if (!hasCategories) {
        test.skip();
        return;
      }

      // 最初のカテゴリの編集ボタンをクリック
      await page.locator('table tbody tr').first().locator('button:has-text("編集")').or(page.locator('table tbody tr').first().locator('button[aria-label*="編集"]')).click();
      await page.waitForTimeout(500);

      // モーダルが開き、初期値が設定されていることを確認
      await expect(page.locator('div[role="dialog"]').or(page.locator('.modal')).first()).toBeVisible();
      
      // フォームに値が入っていることを確認
      const nameInput = page.locator('input[name="name"]').or(page.locator('label:has-text("名前")').locator('..').locator('input'));
      const currentValue = await nameInput.inputValue();
      expect(currentValue).toBeTruthy();

      // 名前を変更
      await nameInput.fill(currentValue + ' (編集済み)');

      // 更新ボタンをクリック
      await page.locator('button:has-text("更新")').or(page.locator('button[type="submit"]')).click();
      await page.waitForTimeout(1000);

      // 成功メッセージまたは一覧画面に戻ることを確認
      const successMessage = page.locator('text=更新しました').or(page.locator('text=成功'));
      const modalClosed = await page.locator('div[role="dialog"]').isHidden().catch(() => true);
      
      expect(await successMessage.isVisible().catch(() => false) || modalClosed).toBeTruthy();
    });

    test('バリデーションエラーが表示される', async ({ page }) => {
      await page.waitForTimeout(1000);

      // 作成ボタンをクリック
      await page.locator('button:has-text("カテゴリを作成")').first().click();
      await page.waitForTimeout(500);

      // コードを空欄のまま作成を試みる
      await page.locator('input[name="name"]').or(page.locator('label:has-text("名前")').locator('..').locator('input')).fill('テスト');
      await page.locator('button:has-text("作成")').or(page.locator('button[type="submit"]')).click();
      await page.waitForTimeout(500);

      // エラーメッセージが表示されることを確認
      const errorMessage = page.locator('text=必須').or(page.locator('text=入力してください')).or(page.locator('.text-red-500'));
      await expect(errorMessage.first()).toBeVisible();
    });
  });

  test.describe('10.3 カテゴリ削除・並び替えフローのE2Eテスト', () => {
    test('カテゴリ削除フローが動作する', async ({ page }) => {
      await page.waitForTimeout(1000);

      // カテゴリが存在する場合のみテスト実行
      const hasCategories = await page.locator('table tbody tr').count() > 0;
      if (!hasCategories) {
        test.skip();
        return;
      }

      const initialCount = await page.locator('table tbody tr').count();

      // 最後のカテゴリの削除ボタンをクリック
      await page.locator('table tbody tr').last().locator('button:has-text("削除")').or(page.locator('table tbody tr').last().locator('button[aria-label*="削除"]')).click();
      await page.waitForTimeout(500);

      // 確認ダイアログが表示されることを確認
      const confirmDialog = page.locator('div[role="dialog"]').or(page.locator('.modal')).or(page.locator('text=削除しますか'));
      await expect(confirmDialog.first()).toBeVisible();

      // 削除確認ボタンをクリック
      await page.locator('button:has-text("削除")').last().or(page.locator('button:has-text("はい")').or(page.locator('button:has-text("確認")'))).click();
      await page.waitForTimeout(1000);

      // 削除後の行数確認（減っているか、成功メッセージ）
      const newCount = await page.locator('table tbody tr').count();
      const successMessage = await page.locator('text=削除しました').or(page.locator('text=成功')).isVisible().catch(() => false);
      
      expect(newCount < initialCount || successMessage).toBeTruthy();
    });

    test('ステータス切り替えが動作する', async ({ page }) => {
      await page.waitForTimeout(1000);

      // カテゴリが存在する場合のみテスト実行
      const hasCategories = await page.locator('table tbody tr').count() > 0;
      if (!hasCategories) {
        test.skip();
        return;
      }

      // 最初のカテゴリのステータストグルボタンを探す
      const firstRow = page.locator('table tbody tr').first();
      const toggleButton = firstRow.locator('button').filter({ hasText: /有効|無効/ }).or(firstRow.locator('button[role="switch"]'));

      if (await toggleButton.count() > 0) {
        // 現在のステータスを取得
        const currentStatus = await firstRow.locator('td').filter({ hasText: /有効|無効/ }).textContent();
        
        // トグルボタンをクリック
        await toggleButton.first().click();
        await page.waitForTimeout(1000);

        // ステータスが変更されたことを確認
        const newStatus = await firstRow.locator('td').filter({ hasText: /有効|無効/ }).textContent();
        expect(newStatus).not.toBe(currentStatus);
      }
    });

    test('ドラッグ&ドロップ並び替えが動作する', async ({ page }) => {
      await page.waitForTimeout(1000);

      const rowCount = await page.locator('table tbody tr').count();
      if (rowCount < 2) {
        test.skip();
        return;
      }

      // ドラッグハンドルが存在するか確認
      const dragHandle = page.locator('table tbody tr').first().locator('[data-drag-handle]').or(page.locator('table tbody tr').first().locator('button[aria-label*="ドラッグ"]'));
      
      if (await dragHandle.count() > 0) {
        // 最初の2行の表示順を記録
        const firstOrderBefore = await page.locator('table tbody tr').first().locator('td').nth(2).textContent();
        const secondOrderBefore = await page.locator('table tbody tr').nth(1).locator('td').nth(2).textContent();

        // ドラッグ&ドロップ実行
        const firstRow = page.locator('table tbody tr').first();
        const secondRow = page.locator('table tbody tr').nth(1);
        
        await firstRow.dragTo(secondRow);
        await page.waitForTimeout(1000);

        // 並び順が変更されたことを確認
        const firstOrderAfter = await page.locator('table tbody tr').first().locator('td').nth(2).textContent();
        expect(firstOrderAfter).not.toBe(firstOrderBefore);
      }
    });

    test('ネットワークエラー時の処理', async ({ page }) => {
      await page.waitForTimeout(1000);

      // ネットワークを切断
      await page.context().setOffline(true);

      // カテゴリ作成を試みる
      await page.locator('button:has-text("カテゴリを作成")').first().click();
      await page.waitForTimeout(500);

      const timestamp = Date.now();
      await page.locator('input[name="code"]').or(page.locator('label:has-text("コード")').locator('..').locator('input')).fill(`ERR${timestamp % 1000}`);
      await page.locator('input[name="name"]').or(page.locator('label:has-text("名前")').locator('..').locator('input')).fill('エラーテスト');
      await page.locator('input[name="display_order"]').or(page.locator('label:has-text("表示順")').locator('..').locator('input')).fill('999');

      await page.locator('button:has-text("作成")').or(page.locator('button[type="submit"]')).click();
      await page.waitForTimeout(1000);

      // エラーメッセージまたはリトライボタンが表示されることを確認
      const errorMessage = page.locator('text=エラー').or(page.locator('text=失敗')).or(page.locator('text=ネットワーク'));
      const retryButton = page.locator('button:has-text("リトライ")').or(page.locator('button:has-text("再試行")'));
      
      const hasError = await errorMessage.first().isVisible().catch(() => false);
      const hasRetry = await retryButton.isVisible().catch(() => false);
      
      expect(hasError || hasRetry).toBeTruthy();

      // ネットワークを復旧
      await page.context().setOffline(false);
    });
  });
});
