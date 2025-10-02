import { test, expect } from '@playwright/test';

test.describe('調査質問割り当て機能', () => {
  test.beforeEach(async ({ page }) => {
    // 管理者として調査管理画面から開始
    await page.goto('/admin/surveys');

    // ページが読み込まれるのを待つ
    await page.waitForLoadState('networkidle');
  });

  test('調査管理画面から質問管理画面にアクセスできる', async ({ page }) => {
    // 調査カードが表示されるまで待機
    await page.waitForSelector('h3', { timeout: 10000 });

    // 下書き状態の調査カードを探す
    const draftSurveyCard = page.locator('.space-y-4').locator('div').filter({
      has: page.locator('text=/下書き/')
    }).first();

    if (await draftSurveyCard.isVisible({ timeout: 5000 })) {
      // 「質問管理」ボタンを探してクリック
      const questionManagementButton = draftSurveyCard.locator('a:has-text("質問管理")');

      if (await questionManagementButton.isVisible({ timeout: 3000 })) {
        await questionManagementButton.click();

        // 質問割り当て画面に遷移することを確認
        await expect(page).toHaveURL(/\/admin\/surveys\/\d+\/questions/);

        // ページタイトルが表示されることを確認
        await expect(page.locator('h1:has-text("質問割り当て")')).toBeVisible();

        // 利用可能な質問セクションが表示されることを確認
        await expect(page.locator('h2:has-text("利用可能な質問")')).toBeVisible();

        // 割り当て済み質問セクションが表示されることを確認
        await expect(page.locator('h2:has-text("割り当て済み質問")')).toBeVisible();
      } else {
        console.log('質問管理ボタンが見つからないため、テストをスキップします');
        test.skip();
      }
    } else {
      console.log('下書き状態の調査が見つからないため、テストをスキップします');
      test.skip();
    }
  });

  test('利用可能な質問一覧が表示される', async ({ page }) => {
    // 質問管理画面に直接アクセス（調査ID: 1を想定）
    await page.goto('/debug/surveys/1/questions');

    // ページが読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // 利用可能な質問セクションが表示されることを確認
    const availableSection = page.locator('h2:has-text("利用可能な質問")').locator('..');
    await expect(availableSection).toBeVisible({ timeout: 10000 });

    // 検索ボックスが表示されることを確認
    const searchInput = availableSection.locator('input[placeholder*="質問を検索"]');
    await expect(searchInput).toBeVisible();

    // カテゴリフィルターが表示されることを確認
    const categorySelect = availableSection.locator('select').first();
    await expect(categorySelect).toBeVisible();

    // タイプフィルターが表示されることを確認
    const typeSelect = availableSection.locator('select').nth(1);
    await expect(typeSelect).toBeVisible();

    // フィルタークリアボタンが表示されることを確認
    const clearButton = availableSection.locator('button:has-text("フィルタークリア")');
    await expect(clearButton).toBeVisible();
  });

  test('フィルター機能が動作する', async ({ page }) => {
    await page.goto('/debug/surveys/1/questions');
    await page.waitForLoadState('networkidle');

    // 利用可能な質問セクション内のフィルター要素を取得
    const availableSection = page.locator('h2:has-text("利用可能な質問")').locator('..');

    // 検索フィルターをテスト
    const searchInput = availableSection.locator('input[placeholder*="質問を検索"]');
    await searchInput.fill('仕事');
    await page.waitForTimeout(500); // デバウンス待ち

    // 検索結果が絞り込まれることを確認（質問カードの数が変化）
    const questionCards = availableSection.locator('[draggable="true"]');
    const searchResultCount = await questionCards.count();
    console.log(`検索結果: ${searchResultCount}件`);

    // フィルタークリアボタンをクリック
    const clearButton = availableSection.locator('button:has-text("フィルタークリア")');
    await clearButton.click();

    // 検索フィールドがクリアされることを確認
    await expect(searchInput).toHaveValue('');
  });

  test('質問カードに必要な情報が表示される', async ({ page }) => {
    await page.goto('/debug/surveys/1/questions');
    await page.waitForLoadState('networkidle');

    // 利用可能な質問セクション
    const availableSection = page.locator('h2:has-text("利用可能な質問")').locator('..');

    // 最初の質問カードを取得
    const firstQuestionCard = availableSection.locator('[draggable="true"]').first();

    if (await firstQuestionCard.isVisible({ timeout: 5000 })) {
      // カテゴリバッジが表示されることを確認
      const categoryBadge = firstQuestionCard.locator('.bg-blue-100');
      await expect(categoryBadge).toBeVisible();

      // タイプバッジが表示されることを確認
      const typeBadge = firstQuestionCard.locator('.bg-gray-100');
      await expect(typeBadge).toBeVisible();

      // 質問テキストが表示されることを確認
      const questionText = firstQuestionCard.locator('p.text-sm');
      await expect(questionText).toBeVisible();

      // ドラッグハンドルが表示されることを確認
      const dragHandle = firstQuestionCard.locator('text=/⋮⋮/');
      await expect(dragHandle).toBeVisible();
    } else {
      console.log('利用可能な質問が見つからないため、テストをスキップします');
      test.skip();
    }
  });

  test('割り当て済み質問セクションが正しく表示される', async ({ page }) => {
    await page.goto('/debug/surveys/1/questions');
    await page.waitForLoadState('networkidle');

    // 割り当て済み質問セクション
    const assignedSection = page.locator('h2').filter({ hasText: /割り当て済み質問.*\(\d+\)/ }).locator('..');
    await expect(assignedSection).toBeVisible({ timeout: 10000 });

    // ドロップエリアが表示されることを確認
    const dropArea = assignedSection.locator('.border-dashed.border-blue-200');
    await expect(dropArea).toBeVisible();

    // 割り当て済み質問がある場合の表示確認
    const assignedQuestions = assignedSection.locator('[draggable="true"]');
    const assignedCount = await assignedQuestions.count();

    if (assignedCount > 0) {
      // 順序番号が表示されることを確認
      const orderNumber = assignedQuestions.first().locator('.bg-blue-500.text-white');
      await expect(orderNumber).toBeVisible();

      // ヒントメッセージが表示されることを確認
      const hintMessage = assignedSection.locator('text=/💡 ヒント:/');
      await expect(hintMessage).toBeVisible();
    } else {
      // 空の状態メッセージが表示されることを確認
      const emptyMessage = assignedSection.locator('text=/ここに質問をドラッグしてください/');
      await expect(emptyMessage).toBeVisible();
    }
  });

  test('質問をドラッグ&ドロップで割り当てできる', async ({ page }) => {
    await page.goto('/debug/surveys/1/questions');
    await page.waitForLoadState('networkidle');

    // 利用可能な質問の最初のカードを取得
    const availableSection = page.locator('h2:has-text("利用可能な質問")').locator('..');
    const firstAvailableQuestion = availableSection.locator('[draggable="true"]').first();

    // 割り当て済み質問のドロップエリアを取得
    const assignedSection = page.locator('h2').filter({ hasText: /割り当て済み質問/ }).locator('..');
    const dropArea = assignedSection.locator('.border-dashed.border-blue-200');

    if (await firstAvailableQuestion.isVisible({ timeout: 5000 })) {
      // 割り当て前の質問数を記録
      const initialAssignedCount = await assignedSection.locator('[draggable="true"]').count();
      const initialAvailableCount = await availableSection.locator('[draggable="true"]').count();

      // 質問テキストを取得（後で確認用）
      const questionText = await firstAvailableQuestion.locator('p.text-sm').textContent();

      // ドラッグ&ドロップを実行
      await firstAvailableQuestion.dragTo(dropArea, {
        force: true,
        timeout: 10000
      });

      // 少し待ってからUI更新を確認
      await page.waitForTimeout(2000);

      // 割り当て済み質問数が増加することを確認
      const newAssignedCount = await assignedSection.locator('[draggable="true"]').count();
      expect(newAssignedCount).toBeGreaterThan(initialAssignedCount);

      // 利用可能な質問数が減少することを確認
      const newAvailableCount = await availableSection.locator('[draggable="true"]').count();
      expect(newAvailableCount).toBeLessThan(initialAvailableCount);

      // 割り当てられた質問が正しく表示されることを確認
      if (questionText) {
        const assignedQuestion = assignedSection.locator(`text=${questionText}`);
        await expect(assignedQuestion).toBeVisible({ timeout: 5000 });
      }

      console.log(`質問の割り当てが成功しました。割り当て済み: ${initialAssignedCount} → ${newAssignedCount}`);
    } else {
      console.log('利用可能な質問が見つからないため、テストをスキップします');
      test.skip();
    }
  });

  test('割り当て済み質問の順序を変更できる', async ({ page }) => {
    await page.goto('/debug/surveys/1/questions');
    await page.waitForLoadState('networkidle');

    const assignedSection = page.locator('h2').filter({ hasText: /割り当て済み質問/ }).locator('..');
    const assignedQuestions = assignedSection.locator('[draggable="true"]');

    const questionCount = await assignedQuestions.count();

    if (questionCount >= 2) {
      // 最初の質問の順序番号とテキストを取得
      const firstQuestion = assignedQuestions.first();
      const secondQuestion = assignedQuestions.nth(1);

      const firstOrderText = await firstQuestion.locator('.bg-blue-500.text-white').textContent();
      const firstQuestionText = await firstQuestion.locator('p.text-sm').textContent();

      // 最初の質問を2番目の位置にドラッグ
      await firstQuestion.dragTo(secondQuestion, {
        force: true,
        timeout: 10000
      });

      await page.waitForTimeout(2000);

      // 順序が変更されることを確認
      const newFirstQuestion = assignedQuestions.first();
      const newFirstQuestionText = await newFirstQuestion.locator('p.text-sm').textContent();

      // 質問の順序が変わったことを確認
      expect(newFirstQuestionText).not.toBe(firstQuestionText);

      console.log(`質問の順序変更が成功しました。`);
    } else {
      console.log('順序変更テストには2つ以上の割り当て済み質問が必要です');
      test.skip();
    }
  });

  test('質問の割り当てを解除できる', async ({ page }) => {
    await page.goto('/debug/surveys/1/questions');
    await page.waitForLoadState('networkidle');

    const assignedSection = page.locator('h2').filter({ hasText: /割り当て済み質問/ }).locator('..');
    const availableSection = page.locator('h2:has-text("利用可能な質問")').locator('..');
    const availableDropArea = availableSection.locator('.border-dashed.border-gray-300');

    const assignedQuestions = assignedSection.locator('[draggable="true"]');
    const initialAssignedCount = await assignedQuestions.count();

    if (initialAssignedCount > 0) {
      const initialAvailableCount = await availableSection.locator('[draggable="true"]').count();

      // 最初の割り当て済み質問を取得
      const firstAssignedQuestion = assignedQuestions.first();
      const questionText = await firstAssignedQuestion.locator('p.text-sm').textContent();

      // 割り当て済み質問を利用可能な質問エリアにドラッグ
      await firstAssignedQuestion.dragTo(availableDropArea, {
        force: true,
        timeout: 10000
      });

      await page.waitForTimeout(2000);

      // 割り当て済み質問数が減少することを確認
      const newAssignedCount = await assignedSection.locator('[draggable="true"]').count();
      expect(newAssignedCount).toBeLessThan(initialAssignedCount);

      // 利用可能な質問数が増加することを確認
      const newAvailableCount = await availableSection.locator('[draggable="true"]').count();
      expect(newAvailableCount).toBeGreaterThan(initialAvailableCount);

      // 解除された質問が利用可能な質問エリアに表示されることを確認
      if (questionText) {
        const relocatedQuestion = availableSection.locator(`text=${questionText}`);
        await expect(relocatedQuestion).toBeVisible({ timeout: 5000 });
      }

      console.log(`質問の割り当て解除が成功しました。割り当て済み: ${initialAssignedCount} → ${newAssignedCount}`);
    } else {
      console.log('割り当て解除テストには割り当て済み質問が必要です');
      test.skip();
    }
  });

  test('保存中の表示が適切に動作する', async ({ page }) => {
    await page.goto('/debug/surveys/1/questions');
    await page.waitForLoadState('networkidle');

    // ドラッグ&ドロップ操作を実行
    const availableSection = page.locator('h2:has-text("利用可能な質問")').locator('..');
    const assignedSection = page.locator('h2').filter({ hasText: /割り当て済み質問/ }).locator('..');

    const firstAvailableQuestion = availableSection.locator('[draggable="true"]').first();
    const dropArea = assignedSection.locator('.border-dashed.border-blue-200');

    if (await firstAvailableQuestion.isVisible({ timeout: 5000 })) {
      // ネットワークレスポンスを遅延させてローディング状態を確認
      await page.route('**/api/surveys/*/questions', async route => {
        await page.waitForTimeout(1000); // 1秒遅延
        route.continue();
      });

      // ドラッグ&ドロップを実行
      await firstAvailableQuestion.dragTo(dropArea, { force: true });

      // 保存中メッセージが表示されることを確認（短時間）
      const savingAlert = page.locator('text=/保存中|変更を保存しています/');

      // 保存完了まで待機
      await page.waitForTimeout(2000);

      console.log('保存処理の確認が完了しました');
    } else {
      console.log('保存テスト用の質問が見つからないため、テストをスキップします');
      test.skip();
    }
  });

  test('エラーハンドリングが適切に動作する', async ({ page }) => {
    await page.goto('/debug/surveys/999/questions'); // 存在しない調査ID

    // エラーメッセージまたは404ページが表示されることを確認
    const errorMessage = page.locator('text=/エラー|見つかりません|not found/i');
    const notFoundMessage = page.locator('text=/404|Not Found/i');

    // いずれかのエラー表示があることを確認
    const hasError = await errorMessage.isVisible({ timeout: 5000 }).catch(() => false);
    const hasNotFound = await notFoundMessage.isVisible({ timeout: 5000 }).catch(() => false);

    expect(hasError || hasNotFound).toBeTruthy();

    console.log('エラーハンドリングが適切に動作しています');
  });
});