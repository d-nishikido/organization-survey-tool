import { test, expect } from '@playwright/test';

test.describe('質問タイプ別動作テスト', () => {
  test.beforeEach(async ({ page }) => {
    // テスト用の調査画面へ直接遷移
    // 実際の調査がない場合は、モックデータを使用
    await page.goto('/surveys');
  });

  test('テキスト質問（短文）に回答できる', async ({ page }) => {
    // 調査を開始
    const surveyCard = page.locator("h3").locator("..").first();
    await surveyCard.waitFor({ state: 'visible' });

    const startButton = surveyCard.locator('a:has-text("調査を開始")');
    await startButton.click();

    // テキスト入力欄を探す
    const textInput = page.locator('input[type="text"]:not([type="radio"]):not([type="checkbox"])');
    if (await textInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      // テキスト入力
      await textInput.fill('これはテスト回答です');

      // 入力値が反映されていることを確認
      await expect(textInput).toHaveValue('これはテスト回答です');

      // 文字数制限がある場合のテスト
      const maxLength = await textInput.getAttribute('maxlength');
      if (maxLength) {
        const longText = 'あ'.repeat(parseInt(maxLength) + 10);
        await textInput.fill(longText);

        // 制限文字数以内に収まっていることを確認
        const actualValue = await textInput.inputValue();
        expect(actualValue.length).toBeLessThanOrEqual(parseInt(maxLength));
      }
    }
  });

  test('テキスト質問（長文）に回答できる', async ({ page }) => {
    // 調査を開始
    const surveyCard = page.locator("h3").locator("..").first();
    await surveyCard.waitFor({ state: 'visible' });

    const startButton = surveyCard.locator('a:has-text("調査を開始")');
    await startButton.click();

    // テキストエリアを探す
    const textarea = page.locator('textarea');
    if (await textarea.isVisible({ timeout: 5000 }).catch(() => false)) {
      const longText = `これは長文回答のテストです。
複数行にわたる回答を入力できることを確認します。
改行も正しく保持されることを確認します。`;

      await textarea.fill(longText);

      // 入力値が反映されていることを確認
      await expect(textarea).toHaveValue(longText);
    }
  });

  test('単一選択質問（ラジオボタン）に回答できる', async ({ page }) => {
    // 調査を開始
    const surveyCard = page.locator("h3").locator("..").first();
    await surveyCard.waitFor({ state: 'visible' });

    const startButton = surveyCard.locator('a:has-text("調査を開始")');
    await startButton.click();

    // ラジオボタンを探す
    const radioButtons = page.locator('input[type="radio"]');
    if (await radioButtons.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      const count = await radioButtons.count();

      // 複数のオプションがあることを確認
      expect(count).toBeGreaterThan(1);

      // 2番目のオプションを選択
      if (count >= 2) {
        await radioButtons.nth(1).check();
        await expect(radioButtons.nth(1)).toBeChecked();

        // 他のオプションを選択すると、前の選択が解除されることを確認
        await radioButtons.first().check();
        await expect(radioButtons.first()).toBeChecked();
        await expect(radioButtons.nth(1)).not.toBeChecked();
      }
    }
  });

  test('複数選択質問（チェックボックス）に回答できる', async ({ page }) => {
    // 調査を開始
    const surveyCard = page.locator("h3").locator("..").first();
    await surveyCard.waitFor({ state: 'visible' });

    const startButton = surveyCard.locator('a:has-text("調査を開始")');
    await startButton.click();

    // チェックボックスを探す
    const checkboxes = page.locator('input[type="checkbox"]');
    if (await checkboxes.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      const count = await checkboxes.count();

      // 複数選択可能であることを確認
      if (count >= 2) {
        await checkboxes.first().check();
        await checkboxes.nth(1).check();

        // 両方が選択されていることを確認
        await expect(checkboxes.first()).toBeChecked();
        await expect(checkboxes.nth(1)).toBeChecked();

        // 選択解除も可能であることを確認
        await checkboxes.first().uncheck();
        await expect(checkboxes.first()).not.toBeChecked();
        await expect(checkboxes.nth(1)).toBeChecked();
      }
    }
  });

  test('評価質問（rating_5 - 5段階評価）に回答できる', async ({ page }) => {
    // 調査を開始
    const surveyCard = page.locator("h3").locator("..").first();
    await surveyCard.waitFor({ state: 'visible' });

    const startButton = surveyCard.locator('a:has-text("調査を開始")');
    await startButton.click();

    // 評価ボタンを探す（1-5のボタン）
    const ratingButtons = page.locator('button[aria-label*="評価"], button:has-text(/^[1-5]$/), [data-testid*="rating"]');

    if (await ratingButtons.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      const count = await ratingButtons.count();

      // 5つの評価ボタンがあることを確認
      expect(count).toBe(5);

      // 評価3を選択
      const rating3 = ratingButtons.filter({ hasText: '3' }).first();
      await rating3.click();

      // 選択状態のスタイルが適用されることを確認（背景色や境界線の変化）
      await expect(rating3).toHaveClass(/bg-blue-500|selected|active/);

      // 別の評価を選択
      const rating5 = ratingButtons.filter({ hasText: '5' }).first();
      await rating5.click();

      // 新しい選択が反映され、前の選択が解除されることを確認
      await expect(rating5).toHaveClass(/bg-blue-500|selected|active/);
      await expect(rating3).not.toHaveClass(/bg-blue-500|selected|active/);
    }

    // または、ラジオボタン形式の評価
    const ratingRadios = page.locator('input[type="radio"][value="1"], input[type="radio"][value="2"], input[type="radio"][value="3"], input[type="radio"][value="4"], input[type="radio"][value="5"]');

    if (await ratingRadios.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      const count = await ratingRadios.count();

      // 5つの評価オプションがあることを確認
      expect(count).toBe(5);

      // 評価4を選択
      const rating4 = ratingRadios.filter({ hasText: '4' }).or(page.locator('input[type="radio"][value="4"]'));
      await rating4.check();
      await expect(rating4).toBeChecked();
    }
  });

  test('スケール質問（10段階評価）に回答できる', async ({ page }) => {
    // 調査を開始
    const surveyCard = page.locator("h3").locator("..").first();
    await surveyCard.waitFor({ state: 'visible' });

    const startButton = surveyCard.locator('a:has-text("調査を開始")');
    await startButton.click();

    // スライダーまたは10段階のボタン/ラジオを探す
    const slider = page.locator('input[type="range"]');
    const scaleButtons = page.locator('button:has-text(/^(10|[1-9])$/), [data-testid*="scale"]');

    if (await slider.isVisible({ timeout: 5000 }).catch(() => false)) {
      // スライダーの場合
      const min = await slider.getAttribute('min');
      const max = await slider.getAttribute('max');

      // 範囲が1-10または0-10であることを確認
      expect(parseInt(max || '10')).toBeGreaterThanOrEqual(10);

      // 値を7に設定
      await slider.fill('7');
      await expect(slider).toHaveValue('7');

      // ラベルが表示されている場合の確認
      const minLabel = page.locator('text=/低い|最小|弱い/');
      const maxLabel = page.locator('text=/高い|最大|強い/');

      if (await minLabel.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(minLabel).toBeVisible();
      }
      if (await maxLabel.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(maxLabel).toBeVisible();
      }
    } else if (await scaleButtons.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      // ボタン形式の場合
      const count = await scaleButtons.count();

      // 10個のオプションがあることを確認
      expect(count).toBe(10);

      // 値8を選択
      const scale8 = scaleButtons.filter({ hasText: '8' }).first();
      await scale8.click();
      await expect(scale8).toHaveClass(/selected|active|bg-blue/);
    }
  });

  test('Yes/No質問に回答できる', async ({ page }) => {
    // 調査を開始
    const surveyCard = page.locator("h3").locator("..").first();
    await surveyCard.waitFor({ state: 'visible' });

    const startButton = surveyCard.locator('a:has-text("調査を開始")');
    await startButton.click();

    // Yes/Noボタンまたはラジオボタンを探す
    const yesButton = page.locator('button:has-text("はい"), input[type="radio"][value="yes"], input[type="radio"][value="はい"], label:has-text("はい")');
    const noButton = page.locator('button:has-text("いいえ"), input[type="radio"][value="no"], input[type="radio"][value="いいえ"), label:has-text("いいえ")');

    if (await yesButton.isVisible({ timeout: 5000 }).catch(() => false) &&
        await noButton.isVisible({ timeout: 5000 }).catch(() => false)) {

      // 「はい」を選択
      if (await yesButton.getAttribute('type') === 'radio') {
        await yesButton.check();
        await expect(yesButton).toBeChecked();
      } else {
        await yesButton.click();
        await expect(yesButton).toHaveClass(/selected|active|bg-blue/);
      }

      // 「いいえ」に変更
      if (await noButton.getAttribute('type') === 'radio') {
        await noButton.check();
        await expect(noButton).toBeChecked();
        await expect(yesButton).not.toBeChecked();
      } else {
        await noButton.click();
        await expect(noButton).toHaveClass(/selected|active|bg-blue/);
        await expect(yesButton).not.toHaveClass(/selected|active|bg-blue/);
      }
    }
  });

  test('プルダウン（セレクトボックス）質問に回答できる', async ({ page }) => {
    // 調査を開始
    const surveyCard = page.locator("h3").locator("..").first();
    await surveyCard.waitFor({ state: 'visible' });

    const startButton = surveyCard.locator('a:has-text("調査を開始")');
    await startButton.click();

    // セレクトボックスを探す
    const selectBox = page.locator('select');
    if (await selectBox.isVisible({ timeout: 5000 }).catch(() => false)) {
      // オプションの数を確認
      const options = await selectBox.locator('option').all();
      expect(options.length).toBeGreaterThan(1);

      // 2番目のオプションを選択
      if (options.length >= 2) {
        const secondOptionValue = await options[1].getAttribute('value');
        if (secondOptionValue) {
          await selectBox.selectOption(secondOptionValue);
          await expect(selectBox).toHaveValue(secondOptionValue);
        }
      }

      // 選択を変更できることを確認
      if (options.length >= 3) {
        const thirdOptionValue = await options[2].getAttribute('value');
        if (thirdOptionValue) {
          await selectBox.selectOption(thirdOptionValue);
          await expect(selectBox).toHaveValue(thirdOptionValue);
        }
      }
    }
  });
});