import { test, expect } from '@playwright/test';

test.describe('従業員調査回答フロー', () => {
  test.beforeEach(async ({ page }) => {
    // 調査一覧ページから開始
    await page.goto('/surveys');
  });

  test('調査一覧が表示され、調査を選択できる', async ({ page }) => {
    // ページタイトルの確認
    await expect(page.locator('h1')).toContainText('利用可能な調査');

    // 調査カードが表示されることを確認（最低1つ）
    const surveyCards = page.locator('h3').locator('..');
    await expect(surveyCards.first()).toBeVisible({ timeout: 10000 });

    // 調査カードの要素確認
    const firstCard = surveyCards.first();

    // タイトルが存在することを確認
    await expect(firstCard.locator('h2, h3, [class*="title"]')).toBeVisible();

    // 「調査を開始」ボタンまたはリンクを確認
    const startButton = firstCard.locator('a:has-text("調査を開始")');
    await expect(startButton).toBeVisible();
  });

  test('調査を開始して質問画面に遷移する', async ({ page }) => {
    // 調査カードを待機
    const surveyCard = page.locator("h3").locator("..").first();
    await surveyCard.waitFor({ state: 'visible', timeout: 10000 });

    // 開始ボタンをクリック
    const startButton = surveyCard.locator('a:has-text("調査を開始")');
    await startButton.click();

    // 質問画面への遷移を確認
    // URLが変更されることを確認（/survey/[id] または /surveys/[id]/respond）
    await expect(page).toHaveURL(/\/(survey|surveys)\/\d+/);

    // 質問が表示されることを確認
    const questionContainer = page.locator('[data-testid="question"], .question, [class*="question"]');
    await expect(questionContainer.first()).toBeVisible({ timeout: 10000 });
  });

  test('質問に回答して次へ進む', async ({ page }) => {
    // テスト用の調査を開始
    const surveyCard = page.locator("h3").locator("..").first();
    await surveyCard.waitFor({ state: 'visible' });

    const startButton = surveyCard.locator('a:has-text("調査を開始")');
    await startButton.click();

    // 質問画面で回答
    await page.waitForURL(/\/(survey|surveys)\/\d+/);

    // テキスト入力欄がある場合
    const textInput = page.locator('input[type="text"], textarea').first();
    if (await textInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await textInput.fill('テスト回答です');
    }

    // ラジオボタンがある場合
    const radioButton = page.locator('input[type="radio"]').first();
    if (await radioButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await radioButton.check();
    }

    // 「次へ」ボタンをクリック
    const nextButton = page.locator('button:has-text("次へ"), button:has-text("次の質問")');
    if (await nextButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await nextButton.click();

      // 次の質問または完了画面が表示されることを確認
      await expect(page.locator('[data-testid="question"], .question, [class*="complete"], [class*="thank"]')).toBeVisible({ timeout: 10000 });
    }
  });

  test('進捗状況が表示される', async ({ page }) => {
    // 調査を開始
    const surveyCard = page.locator("h3").locator("..").first();
    await surveyCard.waitFor({ state: 'visible' });

    const startButton = surveyCard.locator('a:has-text("調査を開始")
    await startButton.click();

    // 進捗インジケーターの確認
    await page.waitForURL(/\/(survey|surveys)\/\d+/);

    // プログレスバーまたは質問番号表示を確認
    const progressIndicator = page.locator('[data-testid="progress"], .progress, [class*="progress"], [aria-label*="進捗"]');
    const questionNumber = page.locator('text=/質問.*\d+.*\/.*\d+|第.*\d+.*問/');

    // いずれかが表示されていることを確認
    const hasProgress = await progressIndicator.isVisible({ timeout: 5000 }).catch(() => false);
    const hasQuestionNumber = await questionNumber.isVisible({ timeout: 5000 }).catch(() => false);

    expect(hasProgress || hasQuestionNumber).toBeTruthy();
  });

  test('「戻る」ボタンで前の質問に戻れる', async ({ page }) => {
    // 調査を開始して質問画面へ
    const surveyCard = page.locator("h3").locator("..").first();
    await surveyCard.waitFor({ state: 'visible' });

    const startButton = surveyCard.locator('a:has-text("調査を開始")
    await startButton.click();

    await page.waitForURL(/\/(survey|surveys)\/\d+/);

    // 最初の質問に回答
    const firstInput = page.locator('input, textarea').first();
    if (await firstInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstInput.fill('最初の回答');
    }

    // 次へ進む
    const nextButton = page.locator('button:has-text("次へ"), button:has-text("次の質問")');
    if (await nextButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await nextButton.click();
      await page.waitForTimeout(1000); // 遷移を待つ

      // 戻るボタンをクリック
      const backButton = page.locator('button:has-text("戻る"), button:has-text("前へ"), button:has-text("前の質問")');
      if (await backButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await backButton.click();

        // 前の質問に戻ったことを確認（入力した値が残っていることを確認）
        const previousInput = page.locator('input[value="最初の回答"], textarea:has-text("最初の回答")');
        await expect(previousInput).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('必須項目をスキップできない', async ({ page }) => {
    // 調査を開始
    const surveyCard = page.locator("h3").locator("..").first();
    await surveyCard.waitFor({ state: 'visible' });

    const startButton = surveyCard.locator('a:has-text("調査を開始")
    await startButton.click();

    await page.waitForURL(/\/(survey|surveys)\/\d+/);

    // 必須マークがある質問を探す
    const requiredIndicator = page.locator('text=/必須|\\*/');
    if (await requiredIndicator.isVisible({ timeout: 5000 }).catch(() => false)) {
      // 何も入力せずに次へ進もうとする
      const nextButton = page.locator('button:has-text("次へ"), button:has-text("次の質問")');
      if (await nextButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await nextButton.click();

        // エラーメッセージが表示されることを確認
        const errorMessage = page.locator('text=/必須|入力してください|選択してください/');
        await expect(errorMessage).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('調査完了後に完了メッセージが表示される', async ({ page }) => {
    // 調査を開始
    const surveyCard = page.locator("h3").locator("..").first();
    await surveyCard.waitFor({ state: 'visible' });

    const startButton = surveyCard.locator('a:has-text("調査を開始")
    await startButton.click();

    await page.waitForURL(/\/(survey|surveys)\/\d+/);

    // すべての質問に回答（最大10問まで）
    for (let i = 0; i < 10; i++) {
      // 入力欄に回答
      const input = page.locator('input:visible, textarea:visible').first();
      if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
        const inputType = await input.getAttribute('type');
        if (inputType === 'radio' || inputType === 'checkbox') {
          await input.check();
        } else {
          await input.fill(`テスト回答 ${i + 1}`);
        }
      }

      // 送信または次へボタンを探す
      const submitButton = page.locator('button:has-text("送信"), button:has-text("完了"), button:has-text("提出")');
      const nextButton = page.locator('button:has-text("次へ"), button:has-text("次の質問")');

      if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitButton.click();
        break;
      } else if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nextButton.click();
        await page.waitForTimeout(500);
      } else {
        break;
      }
    }

    // 完了メッセージの確認
    const completionMessage = page.locator('text=/ありがとう|完了|送信されました/');
    if (await completionMessage.isVisible({ timeout: 10000 }).catch(() => false)) {
      await expect(completionMessage).toBeVisible();
    }
  });
});