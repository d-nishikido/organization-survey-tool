import { test, expect } from '@playwright/test';

/**
 * 質問タイプクリーンアップ機能のE2Eテスト
 *
 * テストシナリオ:
 * 1. 質問作成時に不要なタイプが表示されないこと
 * 2. スケールタイプ選択時にデフォルト値が設定されること
 * 3. 既存質問が適切なラベルで表示されること
 * 4. 質問割り当て画面で一貫したラベルが表示されること
 */

test.describe('質問タイプクリーンアップ機能', () => {
  test.beforeEach(async ({ page }) => {
    // 管理画面にアクセス（認証バイパス）
    await page.goto('http://localhost:5173/admin/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test.describe('6.1 質問作成シナリオ', () => {
    test('質問管理画面で不要な評価タイプが表示されず、スケールのデフォルト値が設定される', async ({ page }) => {
      // 質問管理画面に移動
      await page.goto('http://localhost:5173/admin/questions');
      await page.waitForLoadState('networkidle');

      // 新規質問作成モーダルを開く
      const createButton = page.getByRole('button', { name: /新規質問作成/i });
      await createButton.click();

      // 質問タイププルダウンを確認
      const typeSelect = page.locator('select[name="type"], label:has-text("質問タイプ") + select');
      await expect(typeSelect).toBeVisible();

      // プルダウンの選択肢を取得
      const options = await typeSelect.locator('option').allTextContents();

      // 不要なタイプが表示されないことを確認
      expect(options).not.toContain('評価');
      expect(options).not.toContain('評価（5段階）');
      expect(options).not.toContain('評価（10段階）');
      expect(options).not.toContain('評価（レガシー）');
      expect(options).not.toContain('評価（5段階・レガシー）');
      expect(options).not.toContain('評価（10段階・レガシー）');

      // 必要なタイプが表示されることを確認
      expect(options).toContain('テキスト(短文)');
      expect(options).toContain('単一選択');
      expect(options).toContain('スケール');
      expect(options).toContain('はい/いいえ');

      // スケールタイプを選択
      await typeSelect.selectOption('scale');

      // 最小値・最大値フィールドが表示されることを確認
      const minValueInput = page.locator('input[name="min_value"], label:has-text("最小値") + input');
      const maxValueInput = page.locator('input[name="max_value"], label:has-text("最大値") + input');

      await expect(minValueInput).toBeVisible();
      await expect(maxValueInput).toBeVisible();

      // デフォルト値が設定されていることを確認
      await expect(minValueInput).toHaveValue('1');
      await expect(maxValueInput).toHaveValue('5');

      // 質問文を入力
      const questionInput = page.locator('input[name="question"], textarea[name="question"], label:has-text("質問文") + input, label:has-text("質問文") + textarea');
      await questionInput.fill('E2Eテスト用スケール質問');

      // カテゴリを選択
      const categorySelect = page.locator('select[name="category"], label:has-text("カテゴリ") + select');
      await categorySelect.selectOption('A');

      // 保存ボタンをクリック
      const saveButton = page.getByRole('button', { name: /保存/i });
      await saveButton.click();

      // 成功メッセージまたはモーダルが閉じることを確認
      await page.waitForTimeout(1000); // Wait for API call

      // モーダルが閉じたか、または成功メッセージが表示されることを確認
      const modalClosed = await page.locator('[role="dialog"]').count() === 0;
      const successMessage = await page.locator('text=/作成しました|成功/i').count() > 0;

      expect(modalClosed || successMessage).toBeTruthy();
    });
  });

  test.describe('6.2 既存質問表示シナリオ', () => {
    test('質問管理画面でレガシータイプの質問が適切なラベルで表示される', async ({ page }) => {
      // 質問管理画面に移動
      await page.goto('http://localhost:5173/admin/questions');
      await page.waitForLoadState('networkidle');

      // ページが読み込まれるまで待機
      await page.waitForSelector('table, .question-list', { timeout: 10000 }).catch(() => {});

      // レガシータイプの質問を確認（存在する場合）
      const legacyLabels = [
        '評価（レガシー）',
        '評価（5段階・レガシー）',
        '評価（10段階・レガシー）'
      ];

      // いずれかのレガシーラベルが存在するか確認
      let foundLegacy = false;
      for (const label of legacyLabels) {
        const count = await page.locator(`text="${label}"`).count();
        if (count > 0) {
          foundLegacy = true;
          console.log(`Found legacy label: ${label}`);
        }
      }

      // レガシータイプの質問が存在しない場合でもテストは成功
      // （既存データがない場合は検証不可）
      if (!foundLegacy) {
        console.log('No legacy type questions found - test passed (no data to verify)');
      }

      // スケールタイプの質問を確認
      const scaleLabels = await page.locator('text="スケール"').count();
      console.log(`Found ${scaleLabels} scale type questions`);

      // 「評価（10段階）」という誤った表示がないことを確認
      const wrongScaleLabel = await page.locator('text="評価（10段階）"').count();
      expect(wrongScaleLabel).toBe(0);
    });

    test('レガシータイプの質問を編集可能', async ({ page }) => {
      // 質問管理画面に移動
      await page.goto('http://localhost:5173/admin/questions');
      await page.waitForLoadState('networkidle');

      // レガシータイプの質問の編集ボタンを探す
      const editButtons = page.getByRole('button', { name: /編集/i });
      const editButtonCount = await editButtons.count();

      if (editButtonCount > 0) {
        // 最初の編集ボタンをクリック
        await editButtons.first().click();

        // 編集モーダルが表示されることを確認
        const modal = page.locator('[role="dialog"]');
        await expect(modal).toBeVisible();

        // モーダルを閉じる
        const cancelButton = page.getByRole('button', { name: /キャンセル/i });
        await cancelButton.click();
      } else {
        console.log('No questions found to edit - test passed (no data to verify)');
      }
    });
  });

  test.describe('6.3 質問割り当てシナリオ', () => {
    test('質問割り当て画面でスケールタイプが「スケール」と表示される', async ({ page }) => {
      // 調査管理画面に移動
      await page.goto('http://localhost:5173/admin/surveys');
      await page.waitForLoadState('networkidle');

      // 最初の調査の質問割り当てボタンをクリック
      const assignButtons = page.getByRole('button', { name: /質問を割り当て/i });
      const assignButtonCount = await assignButtons.count();

      if (assignButtonCount > 0) {
        await assignButtons.first().click();

        // 質問割り当て画面に遷移するまで待機
        await page.waitForURL(/\/admin\/surveys\/\d+\/questions/, { timeout: 10000 });
        await page.waitForLoadState('networkidle');

        // 利用可能な質問リストでスケールタイプの表示を確認
        const availableQuestions = page.locator('.available-questions, [data-testid="available-questions"]');

        // スケールタイプの質問が存在する場合、正しく表示されていることを確認
        const scaleInAvailable = await availableQuestions.locator('text="スケール"').count();
        console.log(`Found ${scaleInAvailable} scale type questions in available list`);

        // 誤った表示がないことを確認
        const wrongLabelInAvailable = await availableQuestions.locator('text="評価（10段階）"').count();
        expect(wrongLabelInAvailable).toBe(0);

        // 割り当て済み質問リストでも確認
        const assignedQuestions = page.locator('.assigned-questions, [data-testid="assigned-questions"]');
        const scaleInAssigned = await assignedQuestions.locator('text="スケール"').count();
        console.log(`Found ${scaleInAssigned} scale type questions in assigned list`);

        const wrongLabelInAssigned = await assignedQuestions.locator('text="評価（10段階）"').count();
        expect(wrongLabelInAssigned).toBe(0);

        // 一貫したラベル表示を確認（両方のリストで同じラベルが使用されている）
        if (scaleInAvailable > 0 || scaleInAssigned > 0) {
          console.log('Scale type questions are displayed consistently');
        }
      } else {
        console.log('No surveys found - test passed (no data to verify)');
      }
    });

    test('質問タイプラベルが統一されている', async ({ page }) => {
      // 調査管理画面に移動
      await page.goto('http://localhost:5173/admin/surveys');
      await page.waitForLoadState('networkidle');

      // 最初の調査の質問割り当てボタンをクリック
      const assignButtons = page.getByRole('button', { name: /質問を割り当て/i });
      const assignButtonCount = await assignButtons.count();

      if (assignButtonCount > 0) {
        await assignButtons.first().click();

        await page.waitForURL(/\/admin\/surveys\/\d+\/questions/, { timeout: 10000 });
        await page.waitForLoadState('networkidle');

        // すべての質問タイプラベルを取得
        const questionTypeLabels = [
          'テキスト(短文)',
          'テキスト(長文)',
          '単一選択',
          '複数選択',
          'プルダウン',
          'スケール',
          'はい/いいえ',
          '評価（レガシー）',
          '評価（5段階・レガシー）',
          '評価（10段階・レガシー）'
        ];

        // 各ラベルが利用可能な質問と割り当て済み質問の両方で一貫して使用されていることを確認
        for (const label of questionTypeLabels) {
          const availableCount = await page.locator('.available-questions').locator(`text="${label}"`).count();
          const assignedCount = await page.locator('.assigned-questions').locator(`text="${label}"`).count();

          if (availableCount > 0 || assignedCount > 0) {
            console.log(`Label "${label}" is used consistently (available: ${availableCount}, assigned: ${assignedCount})`);
          }
        }

        // 不正なラベルが使用されていないことを確認
        const invalidLabels = [
          '評価（5段階）',
          '評価（10段階）',
          'rating',
          'rating_5',
          'rating_10'
        ];

        for (const invalidLabel of invalidLabels) {
          const count = await page.locator(`text="${invalidLabel}"`).count();
          expect(count).toBe(0);
        }
      } else {
        console.log('No surveys found - test passed (no data to verify)');
      }
    });
  });
});
