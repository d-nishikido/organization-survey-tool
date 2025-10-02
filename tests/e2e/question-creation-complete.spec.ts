import { test, expect } from '@playwright/test';

/**
 * 質問作成機能の完全なE2Eテスト
 * Complete Question Creation E2E Tests
 *
 * フォーム送信、バリデーション、質問タイプ別のテストを含む包括的なテストスイート
 */

test.describe('質問作成 - 完全なプロセステスト (Question Creation - Complete Process)', () => {
  test.beforeEach(async ({ page }) => {
    // Login as HR Manager first
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("HR Manager")');
    await page.waitForURL('**/admin');

    // Navigate to question management page
    await page.goto('/admin/questions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('テキスト質問の作成（完全なフロー）', async ({ page }) => {
    // Step 1: 質問作成モーダルを開く
    await page.locator('button:has-text("新しい質問を作成")').first().click();
    await page.waitForTimeout(1000);

    // モーダルが表示されることを確認
    await expect(page.locator('h3:has-text("新しい質問を作成")')).toBeVisible();

    // Step 2: フォームに入力
    await page.locator('textarea[placeholder*="質問を入力"]').fill('仕事に対する満足度を教えてください');

    // カテゴリを選択
    await page.locator('select').first().selectOption('D');

    // 質問タイプを選択（デフォルトのテキストのまま）
    await page.locator('select').nth(1).selectOption('text');

    // 必須設定
    await page.locator('input[type="checkbox"]').check();

    // Step 3: フォーム送信
    await page.locator('button:has-text("作成")').click();

    // Step 4: 成功確認
    // ローディングが終わるまで待つ
    await page.waitForTimeout(3000);

    // モーダルが閉じることを確認
    await expect(page.locator('h3:has-text("新しい質問を作成")')).not.toBeVisible();

    // 質問リストに新しい質問が表示されることを確認
    await expect(page.locator('text=仕事に対する満足度を教えてください')).toBeVisible();

    console.log('✅ Text question creation completed successfully');
  });

  test('選択肢質問の作成（radio type）', async ({ page }) => {
    // Step 1: モーダルを開く
    await page.locator('button:has-text("新しい質問を作成")').first().click();
    await page.waitForTimeout(1000);

    // Step 2: フォーム入力
    await page.locator('textarea[placeholder*="質問を入力"]').fill('あなたの職位を選択してください');

    // カテゴリ選択
    await page.locator('select').first().selectOption('G');

    // 質問タイプを radio に変更
    await page.locator('select').nth(1).selectOption('radio');

    // 選択肢フィールドが表示されるまで待つ
    await page.waitForTimeout(1000);

    // Step 3: 選択肢を追加
    const option1 = page.locator('input[placeholder="選択肢 1"]');
    await option1.fill('一般社員');

    const option2 = page.locator('input[placeholder="選択肢 2"]');
    await option2.fill('主任・係長');

    // 3つ目の選択肢を追加
    await page.locator('button:has-text("選択肢を追加")').click();
    await page.waitForTimeout(500);

    const option3 = page.locator('input[placeholder="選択肢 3"]');
    await option3.fill('課長・部長');

    // Step 4: 送信
    await page.locator('button:has-text("作成")').click();
    await page.waitForTimeout(3000);

    // Step 5: 確認
    await expect(page.locator('h3:has-text("新しい質問を作成")')).not.toBeVisible();
    await expect(page.locator('text=あなたの職位を選択してください')).toBeVisible();

    console.log('✅ Radio question creation completed successfully');
  });

  test('評価質問の作成（rating type）', async ({ page }) => {
    // Step 1: モーダルを開く
    await page.locator('button:has-text("新しい質問を作成")').first().click();
    await page.waitForTimeout(1000);

    // Step 2: フォーム入力
    await page.locator('textarea[placeholder*="質問を入力"]').fill('職場の環境を5段階で評価してください');

    // カテゴリ選択
    await page.locator('select').first().selectOption('F');

    // 質問タイプを rating に変更
    await page.locator('select').nth(1).selectOption('rating');

    // 評価フィールドが表示されるまで待つ
    await page.waitForTimeout(1000);

    // Step 3: 評価範囲を設定
    await page.locator('input[type="number"]').first().fill('1');
    await page.locator('input[type="number"]').nth(1).fill('5');

    // ラベルを設定
    await page.locator('input[placeholder*="全く思わない"]').fill('非常に悪い');
    await page.locator('input[placeholder*="強く思う"]').fill('非常に良い');

    // Step 4: 送信
    await page.locator('button:has-text("作成")').click();
    await page.waitForTimeout(3000);

    // Step 5: 確認
    await expect(page.locator('h3:has-text("新しい質問を作成")')).not.toBeVisible();
    await expect(page.locator('text=職場の環境を5段階で評価してください')).toBeVisible();

    console.log('✅ Rating question creation completed successfully');
  });

  test('バリデーションエラーのテスト', async ({ page }) => {
    // Step 1: モーダルを開く
    await page.locator('button:has-text("新しい質問を作成")').first().click();
    await page.waitForTimeout(1000);

    // Step 2: 空のフォームで送信を試行
    await page.locator('button:has-text("作成")').click();

    // Step 3: バリデーションエラーの確認
    await expect(page.locator('text=質問文は必須です')).toBeVisible();

    // Step 4: 選択肢質問で選択肢不足のテスト
    await page.locator('textarea[placeholder*="質問を入力"]').fill('選択肢テスト');
    await page.locator('select').nth(1).selectOption('radio');
    await page.waitForTimeout(1000);

    // 選択肢を1つだけ入力
    await page.locator('input[placeholder="選択肢 1"]').fill('選択肢1');

    // 送信を試行
    await page.locator('button:has-text("作成")').click();

    // バリデーションエラーを確認
    await expect(page.locator('text=選択肢は2つ以上設定してください')).toBeVisible();

    console.log('✅ Validation errors working correctly');
  });

  test('評価質問の範囲バリデーション', async ({ page }) => {
    // Step 1: モーダルを開く
    await page.locator('button:has-text("新しい質問を作成")').first().click();
    await page.waitForTimeout(1000);

    // Step 2: 評価質問の設定
    await page.locator('textarea[placeholder*="質問を入力"]').fill('範囲テスト');
    await page.locator('select').nth(1).selectOption('rating');
    await page.waitForTimeout(1000);

    // Step 3: 無効な範囲を設定（最大値 <= 最小値）
    await page.locator('input[type="number"]').first().fill('5');
    await page.locator('input[type="number"]').nth(1).fill('3');

    // 送信を試行
    await page.locator('button:has-text("作成")').click();

    // バリデーションエラーを確認
    await expect(page.locator('text=最大値は最小値より大きく設定してください')).toBeVisible();

    console.log('✅ Range validation working correctly');
  });

  test('質問作成後の一覧更新確認', async ({ page }) => {
    // 作成前の質問数を取得
    const initialQuestions = await page.locator('.space-y-3 > div').count();
    console.log(`📊 Initial question count: ${initialQuestions}`);

    // 新しい質問を作成
    await page.locator('button:has-text("新しい質問を作成")').first().click();
    await page.waitForTimeout(1000);

    const uniqueQuestionText = `テスト質問 ${Date.now()}`;
    await page.locator('textarea[placeholder*="質問を入力"]').fill(uniqueQuestionText);
    await page.locator('button:has-text("作成")').click();
    await page.waitForTimeout(3000);

    // 作成後の質問数を確認
    const finalQuestions = await page.locator('.space-y-3 > div').count();
    console.log(`📊 Final question count: ${finalQuestions}`);

    // 質問数が増加していることを確認
    expect(finalQuestions).toBeGreaterThan(initialQuestions);

    // 新しい質問が表示されることを確認
    await expect(page.locator(`text=${uniqueQuestionText}`)).toBeVisible();

    console.log('✅ Question list updated correctly after creation');
  });

  test('質問タイプ変更時のフォーム動的変更', async ({ page }) => {
    // モーダルを開く
    await page.locator('button:has-text("新しい質問を作成")').first().click();
    await page.waitForTimeout(1000);

    // 初期状態（テキスト）を確認
    await expect(page.locator('button:has-text("選択肢を追加")')).not.toBeVisible();
    await expect(page.locator('input[type="number"]')).not.toBeVisible();

    // 選択肢質問に変更
    await page.locator('select').nth(1).selectOption('radio');
    await page.waitForTimeout(1000);

    // 選択肢フィールドが表示されることを確認
    await expect(page.locator('button:has-text("選択肢を追加")')).toBeVisible();
    await expect(page.locator('input[placeholder="選択肢 1"]')).toBeVisible();

    // 評価質問に変更
    await page.locator('select').nth(1).selectOption('rating');
    await page.waitForTimeout(1000);

    // 評価フィールドが表示されることを確認
    await expect(page.locator('input[type="number"]')).toBeVisible();
    await expect(page.locator('button:has-text("選択肢を追加")')).not.toBeVisible();

    console.log('✅ Dynamic form changes working correctly');
  });

  test('モーダルのキャンセル機能', async ({ page }) => {
    // モーダルを開く
    await page.locator('button:has-text("新しい質問を作成")').first().click();
    await page.waitForTimeout(1000);

    // フォームに入力
    await page.locator('textarea[placeholder*="質問を入力"]').fill('キャンセルテスト');

    // キャンセルボタンをクリック
    await page.locator('button:has-text("キャンセル")').click();

    // モーダルが閉じることを確認
    await expect(page.locator('h3:has-text("新しい質問を作成")')).not.toBeVisible();

    // 質問が作成されていないことを確認
    await expect(page.locator('text=キャンセルテスト')).not.toBeVisible();

    console.log('✅ Modal cancel functionality working correctly');
  });
});

test.describe('質問作成エラーハンドリング (Question Creation Error Handling)', () => {
  test.beforeEach(async ({ page }) => {
    // Login as HR Manager first
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("HR Manager")');
    await page.waitForURL('**/admin');

    await page.goto('/admin/questions');
    await page.waitForLoadState('networkidle');
  });

  test('API エラー時の質問作成失敗', async ({ page }) => {
    // API エラーを設定
    await page.route('**/api/questions', route => {
      if (route.request().method() === 'POST') {
        console.log('🔴 Question creation API request intercepted and failed');
        route.abort('failed');
      } else {
        route.continue();
      }
    });

    // 質問作成を試行
    await page.locator('button:has-text("新しい質問を作成")').first().click();
    await page.waitForTimeout(1000);

    await page.locator('textarea[placeholder*="質問を入力"]').fill('エラーテスト質問');
    await page.locator('button:has-text("作成")').click();

    // エラーメッセージの確認
    await page.waitForTimeout(3000);

    const hasError = await page.locator('text=保存に失敗しました').isVisible() ||
                     await page.locator('.bg-red-50').isVisible() ||
                     await page.locator('text=エラー').isVisible();

    expect(hasError).toBeTruthy();
    console.log('✅ Question creation error handling validated');
  });

  test('サーバーエラー500時の質問作成', async ({ page }) => {
    // サーバーエラーを模擬
    await page.route('**/api/questions', route => {
      if (route.request().method() === 'POST') {
        console.log('🔴 Question creation returning 500 error');
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Internal Server Error'
          })
        });
      } else {
        route.continue();
      }
    });

    // 質問作成を試行
    await page.locator('button:has-text("新しい質問を作成")').first().click();
    await page.waitForTimeout(1000);

    await page.locator('textarea[placeholder*="質問を入力"]').fill('サーバーエラーテスト');
    await page.locator('button:has-text("作成")').click();

    // エラー処理の確認
    await page.waitForTimeout(3000);

    const hasError = await page.locator('text=保存に失敗しました').isVisible() ||
                     await page.locator('.bg-red-50').isVisible();

    expect(hasError).toBeTruthy();
    console.log('✅ Server error handling during creation validated');
  });
});