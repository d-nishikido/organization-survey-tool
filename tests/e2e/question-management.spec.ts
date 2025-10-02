import { test, expect } from '@playwright/test';

/**
 * 質問管理機能のE2Eテスト
 * Question Management functionality E2E tests
 */

test.describe('質問管理機能 (Question Management)', () => {
  test.beforeEach(async ({ page }) => {
    // Login as HR Manager first
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    // Click the HR Manager button (Button index 2)
    await page.locator('button').nth(2).click();
    await page.waitForURL('**/admin');
    
    // Wait for authentication to be fully processed
    await page.waitForTimeout(1000);
    
    // Navigate to question management through menu or direct link
    // Check if there's a navigation menu item first
    const questionMenuLink = page.locator('a[href="/admin/questions"]');
    if (await questionMenuLink.isVisible()) {
      await questionMenuLink.click();
    } else {
      // Fallback to direct navigation
      await page.goto('/admin/questions');
    }
    await page.waitForLoadState('networkidle');
    
    // Wait a bit more for the page to fully load
    await page.waitForTimeout(1000);
  });

  test('質問管理ページが正しく表示される', async ({ page }) => {
    // Wait for page to fully load
    await page.waitForTimeout(2000);
    
    // Check if we're actually on the questions page
    await expect(page).toHaveURL(/.*\/admin\/questions/);
    
    // ページタイトルを確認
    await expect(page.locator('h1:has-text("質問管理")')).toBeVisible();

    // 主要な要素が表示されているか確認
    await expect(page.locator('button:has-text("新しい質問を作成")').first()).toBeVisible();
    await expect(page.locator('input[placeholder*="質問を検索"]')).toBeVisible();

    // フィルター要素の確認
    await expect(page.locator('select').first()).toBeVisible(); // カテゴリフィルター
  });

  test('質問一覧が表示される', async ({ page }) => {
    // ページが既に読み込まれているので、APIレスポンスではなくコンテンツを確認
    await page.waitForTimeout(1000);

    // 質問リストまたは空の状態が表示される
    const hasQuestions = await page.locator('.space-y-3 > div').count() > 0;
    const hasEmptyState = await page.locator('text=質問がありません').isVisible();

    expect(hasQuestions || hasEmptyState).toBeTruthy();

    // 質問が存在する場合、必要な要素を確認
    if (hasQuestions) {
      const firstQuestion = page.locator('.space-y-3 > div').first();
      await expect(firstQuestion).toBeVisible();

      // カテゴリバッジが表示される
      await expect(firstQuestion.locator('.bg-blue-100')).toBeVisible();
      // 質問タイプが表示される
      await expect(firstQuestion.locator('.bg-gray-100')).toBeVisible();
      // 編集・削除ボタンが表示される
      await expect(firstQuestion.locator('button:has-text("編集")')).toBeVisible();
      await expect(firstQuestion.locator('button:has-text("削除")')).toBeVisible();
    }
  });

  test('質問作成モーダルが開く', async ({ page }) => {
    // 新規作成ボタンをクリック (ヘッダーの最初のボタンを選択)
    await page.locator('button:has-text("新しい質問を作成")').first().click();

    // 少し待ってからモーダルの表示を確認
    await page.waitForTimeout(1000);

    // モーダルが表示される (タイトルで確認)
    await expect(page.locator('h3:has-text("新しい質問を作成")')).toBeVisible();

    // フォームフィールドが存在する
    await expect(page.locator('textarea[placeholder*="質問を入力"]')).toBeVisible();
    await expect(page.locator('label:has-text("カテゴリ")')).toBeVisible();
    await expect(page.locator('label:has-text("質問タイプ")')).toBeVisible();
  });

  test('質問作成フォーム送信（完全なフロー）', async ({ page }) => {
    // 新規作成ボタンをクリック
    await page.locator('button:has-text("新しい質問を作成")').first().click();
    await page.waitForTimeout(1000);

    // フォームに入力
    const uniqueQuestion = `E2Eテスト質問 ${Date.now()}`;
    await page.locator('textarea[placeholder*="質問を入力"]').fill(uniqueQuestion);

    // カテゴリを選択
    await page.locator('select').first().selectOption('A');

    // 質問タイプを選択（テキストのまま）
    await page.locator('select').nth(1).selectOption('text');

    // 必須設定
    await page.locator('input[type="checkbox"]').check();

    // 送信ボタンをクリック (3つ目の"作成"ボタン = モーダル内のボタン)
    await page.locator('button:has-text("作成")').nth(2).click();

    // 作成処理の完了を待つ
    await page.waitForTimeout(3000);

    // モーダルが閉じることを確認
    await expect(page.locator('h3:has-text("新しい質問を作成")')).not.toBeVisible();

    // 作成した質問が一覧に表示されることを確認
    await expect(page.locator(`text=${uniqueQuestion}`)).toBeVisible();

    console.log('✅ Question creation flow completed successfully');
  });

  test('質問作成バリデーションテスト', async ({ page }) => {
    // 新規作成ボタンをクリック
    await page.locator('button:has-text("新しい質問を作成")').first().click();
    await page.waitForTimeout(1000);

    // 空のフォームで送信を試行 (3つ目の"作成"ボタン = モーダル内のボタン)
    await page.locator('button:has-text("作成")').nth(2).click();

    // バリデーションエラーの確認
    await expect(page.locator('text=質問文は必須です')).toBeVisible();

    console.log('✅ Question creation validation working correctly');
  });

  test('フィルター機能が動作する', async ({ page }) => {
    // 検索フィールドに入力
    const searchInput = page.locator('input[placeholder*="質問を検索"]');
    await searchInput.fill('エンゲージメント');
    
    // 少し待ってから確認 (デバウンス処理があるかもしれない)
    await page.waitForTimeout(1500);

    // カテゴリフィルター
    const categorySelect = page.locator('select').first();
    await categorySelect.selectOption('A');
    
    // フィルター適用後の結果を待つ
    await page.waitForTimeout(1500);
  });

  test('質問の編集モーダルが開く', async ({ page }) => {
    // 質問が存在することを確認
    const questions = page.locator('.space-y-3 > div');
    const questionCount = await questions.count();

    if (questionCount > 0) {
      // 最初の質問の編集ボタンをクリック
      await questions.first().locator('button:has-text("編集")').click();

      // 編集モーダルが表示される
      await expect(page.locator('[role="dialog"]')).toBeVisible();
      await expect(page.locator('text=質問を編集')).toBeVisible();

      // フォームに既存データが入力されている
      const textarea = page.locator('textarea');
      const existingText = await textarea.inputValue();
      expect(existingText).toBeTruthy();
    }
  });

  test('ページネーションが機能する', async ({ page }) => {
    // ページネーション要素を探す
    const pagination = page.locator('text=ページ中');

    if (await pagination.isVisible()) {
      // 次のページボタンがあれば動作確認
      const nextButton = page.locator('button:has-text("次のページ")');
      if (await nextButton.isEnabled()) {
        await nextButton.click();

        // ページが変更されたことを確認
        await page.waitForResponse('**/api/questions?page=2**');
      }
    }
  });

  test('削除確認ダイアログが表示される', async ({ page }) => {
    const questions = page.locator('.space-y-3 > div');
    const questionCount = await questions.count();

    if (questionCount > 0) {
      // ダイアログハンドラーを設定
      page.on('dialog', dialog => {
        expect(dialog.message()).toContain('削除');
        dialog.dismiss(); // キャンセル
      });

      // 削除ボタンをクリック
      await questions.first().locator('button:has-text("削除")').click();
    }
  });

  test('レスポンシブデザインが機能する（モバイル）', async ({ page }) => {
    // モバイルビューポートに設定
    await page.setViewportSize({ width: 375, height: 667 });

    // ページをリロード
    await page.goto('/admin/questions');
    await page.waitForLoadState('networkidle');

    // 主要要素が表示される
    await expect(page.locator('h1:has-text("質問管理")')).toBeVisible();

    // 横スクロールがないことを確認
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalScroll).toBeFalsy();
  });
});

test.describe('調査-質問割り当て機能 (Survey-Question Assignment)', () => {
  test.beforeEach(async ({ page }) => {
    // Login as HR Manager first
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    // Click the HR Manager button (Button index 2)
    await page.locator('button').nth(2).click();
    await page.waitForURL('**/admin');
  });

  test('調査の質問割り当てページが表示される', async ({ page }) => {
    // まず調査一覧を取得
    await page.goto('/admin/surveys');
    await page.waitForLoadState('networkidle');

    const surveys = page.locator('.grid > div');
    const surveyCount = await surveys.count();

    if (surveyCount > 0) {
      // 最初の調査の質問割り当てページへ
      await page.goto('/admin/surveys/1/questions');
      await page.waitForLoadState('networkidle');

      // ページ要素を確認
      await expect(page.locator('h1:has-text("質問割り当て")')).toBeVisible();
      await expect(page.locator('text=利用可能な質問')).toBeVisible();
      await expect(page.locator('text=割り当て済み質問')).toBeVisible();
    }
  });

  test('ドラッグ&ドロップのUIが表示される', async ({ page }) => {
    await page.goto('/admin/surveys/1/questions');
    await page.waitForLoadState('networkidle');

    // ドラッグ可能な要素の確認
    const draggableQuestions = page.locator('[draggable="true"]');
    const count = await draggableQuestions.count();

    if (count > 0) {
      // カーソルがmoveになることを確認
      const firstQuestion = draggableQuestions.first();
      const cursor = await firstQuestion.evaluate(el =>
        window.getComputedStyle(el).cursor
      );
      expect(cursor).toBe('move');
    }

    // ドロップゾーンの確認
    await expect(page.locator('.border-dashed')).toBeVisible();
  });

  test('APIエンドポイントが正しく動作する', async ({ page }) => {
    // 質問APIの確認
    const questionsResponse = await page.request.get('http://localhost:3001/api/questions');
    expect(questionsResponse.ok()).toBeTruthy();

    const questionsData = await questionsResponse.json();
    expect(questionsData).toHaveProperty('data');

    // 調査APIの確認
    const surveysResponse = await page.request.get('http://localhost:3001/api/surveys');
    expect(surveysResponse.ok()).toBeTruthy();

    // 調査-質問関連APIの確認
    const surveyQuestionsResponse = await page.request.get('http://localhost:3001/api/surveys/1/questions');
    expect(surveyQuestionsResponse.ok()).toBeTruthy();
  });

  test('JavaScriptエラーが発生しない', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error' && !msg.text().includes('favicon')) {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', err => {
      errors.push(err.message);
    });

    await page.goto('/admin/questions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // クリティカルエラーをフィルター
    const criticalErrors = errors.filter(error =>
      !error.includes('net::ERR_') &&
      !error.includes('ResizeObserver') &&
      !error.includes('Failed to load resource')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('空の状態が正しく表示される', async ({ page }) => {
    await page.goto('/admin/questions');
    await page.waitForLoadState('networkidle');

    // 質問がない場合の表示を確認
    const emptyState = page.locator('text=質問がありません');
    const questionList = page.locator('.space-y-3 > div');

    if (await emptyState.isVisible()) {
      await expect(emptyState).toBeVisible();
      await expect(page.locator('text=新しい質問を作成して、質問バンクを構築しましょう')).toBeVisible();
      await expect(page.locator('button:has-text("最初の質問を作成")')).toBeVisible();
    } else {
      // 質問が存在する
      const count = await questionList.count();
      expect(count).toBeGreaterThan(0);
    }
  });
});