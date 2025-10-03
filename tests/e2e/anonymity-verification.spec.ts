import { test, expect } from '@playwright/test';

test.describe('匿名性確保のテスト', () => {
  test('個人情報入力欄が存在しないことを確認', async ({ page }) => {
    // 調査一覧から調査を開始
    await page.goto('/surveys');

    const surveyCard = page.locator("h3").locator("..").first();
    await surveyCard.waitFor({ state: 'visible' });

    const startButton = surveyCard.locator('a:has-text("調査を開始")');
    await startButton.click();

    // 個人情報に関する入力欄が存在しないことを確認
    const personalInfoFields = page.locator(`
      input[name*="name"],
      input[name*="email"],
      input[name*="phone"],
      input[name*="address"],
      input[name*="id"],
      input[name*="employee"],
      input[type="email"],
      input[placeholder*="名前"],
      input[placeholder*="メール"],
      input[placeholder*="電話"],
      input[placeholder*="住所"],
      input[placeholder*="社員番号"]
    `);

    // 個人情報フィールドが存在しないことを確認
    const count = await personalInfoFields.count();
    expect(count).toBe(0);
  });

  test('ネットワークリクエストに個人情報が含まれないことを確認', async ({ page }) => {
    // ネットワークリクエストを監視
    const requests: any[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/') || request.url().includes('/survey')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        });
      }
    });

    // 調査を開始
    await page.goto('/surveys');

    const surveyCard = page.locator("h3").locator("..").first();
    await surveyCard.waitFor({ state: 'visible' });

    const startButton = surveyCard.locator('a:has-text("調査を開始")');
    await startButton.click();

    // 質問に回答
    const input = page.locator('input:visible, textarea:visible').first();
    if (await input.isVisible({ timeout: 5000 }).catch(() => false)) {
      const inputType = await input.getAttribute('type');
      if (inputType === 'radio' || inputType === 'checkbox') {
        await input.check();
      } else {
        await input.fill('匿名回答テスト');
      }

      // 次へまたは送信
      const submitButton = page.locator('button').filter({ hasText: /次へ|送信|完了/ }).first();
      if (await submitButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await submitButton.click();
        await page.waitForTimeout(1000); // リクエストを待つ
      }
    }

    // リクエストに個人識別情報が含まれていないことを確認
    for (const request of requests) {
      if (request.postData) {
        const postData = request.postData.toLowerCase();

        // 個人情報キーワードが含まれていないことを確認
        expect(postData).not.toContain('user_id');
        expect(postData).not.toContain('employee_id');
        expect(postData).not.toContain('email');
        expect(postData).not.toContain('name');
        expect(postData).not.toContain('phone');
      }

      // ヘッダーにも個人識別情報が含まれていないことを確認
      const headers = request.headers;
      expect(headers['x-user-id']).toBeUndefined();
      expect(headers['x-employee-id']).toBeUndefined();
    }
  });

  test('LocalStorageに個人情報が保存されないことを確認', async ({ page }) => {
    // 調査を開始
    await page.goto('/surveys');

    const surveyCard = page.locator("h3").locator("..").first();
    await surveyCard.waitFor({ state: 'visible' });

    const startButton = surveyCard.locator('a:has-text("調査を開始")');
    await startButton.click();

    // LocalStorageの内容を取得
    const localStorage = await page.evaluate(() => {
      const items: Record<string, string> = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) {
          items[key] = window.localStorage.getItem(key) || '';
        }
      }
      return items;
    });

    // LocalStorageに個人情報が含まれていないことを確認
    for (const [key, value] of Object.entries(localStorage)) {
      const lowerKey = key.toLowerCase();
      const lowerValue = value.toLowerCase();

      // キーに個人情報関連の文字列が含まれていないことを確認
      expect(lowerKey).not.toContain('user_id');
      expect(lowerKey).not.toContain('employee');
      expect(lowerKey).not.toContain('email');
      expect(lowerKey).not.toContain('name');
      expect(lowerKey).not.toContain('personal');

      // 値に個人情報パターンが含まれていないことを確認
      // メールアドレスパターン
      expect(lowerValue).not.toMatch(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/);
      // 電話番号パターン（日本）
      expect(lowerValue).not.toMatch(/0\d{1,4}-\d{1,4}-\d{4}/);
      // 社員番号パターン（例：EMP12345）
      expect(lowerValue).not.toMatch(/emp\d+|employee\d+/);
    }
  });

  test('SessionStorageに個人情報が保存されないことを確認', async ({ page }) => {
    // 調査を開始
    await page.goto('/surveys');

    const surveyCard = page.locator("h3").locator("..").first();
    await surveyCard.waitFor({ state: 'visible' });

    const startButton = surveyCard.locator('a:has-text("調査を開始")');
    await startButton.click();

    // SessionStorageの内容を取得
    const sessionStorage = await page.evaluate(() => {
      const items: Record<string, string> = {};
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        if (key) {
          items[key] = window.sessionStorage.getItem(key) || '';
        }
      }
      return items;
    });

    // SessionStorageに個人情報が含まれていないことを確認
    for (const [key, value] of Object.entries(sessionStorage)) {
      const lowerKey = key.toLowerCase();
      const lowerValue = value.toLowerCase();

      // キーに個人情報関連の文字列が含まれていないことを確認
      expect(lowerKey).not.toContain('user_id');
      expect(lowerKey).not.toContain('employee');
      expect(lowerKey).not.toContain('email');
      expect(lowerKey).not.toContain('name');
      expect(lowerKey).not.toContain('personal');

      // 値に個人情報パターンが含まれていないことを確認
      expect(lowerValue).not.toMatch(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/);
      expect(lowerValue).not.toMatch(/0\d{1,4}-\d{1,4}-\d{4}/);
      expect(lowerValue).not.toMatch(/emp\d+|employee\d+/);
    }
  });

  test('Cookieに個人情報が含まれないことを確認', async ({ page, context }) => {
    // 調査を開始
    await page.goto('/surveys');

    const surveyCard = page.locator("h3").locator("..").first();
    await surveyCard.waitFor({ state: 'visible' });

    const startButton = surveyCard.locator('a:has-text("調査を開始")');
    await startButton.click();

    // Cookieを取得
    const cookies = await context.cookies();

    // Cookieに個人情報が含まれていないことを確認
    for (const cookie of cookies) {
      const lowerName = cookie.name.toLowerCase();
      const lowerValue = cookie.value.toLowerCase();

      // Cookie名に個人情報関連の文字列が含まれていないことを確認
      expect(lowerName).not.toContain('user_id');
      expect(lowerName).not.toContain('employee');
      expect(lowerName).not.toContain('email');
      expect(lowerName).not.toContain('personal');

      // Cookie値に個人情報パターンが含まれていないことを確認
      expect(lowerValue).not.toMatch(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/);
      expect(lowerValue).not.toMatch(/0\d{1,4}-\d{1,4}-\d{4}/);
    }
  });

  test('匿名性に関する説明が表示されることを確認', async ({ page }) => {
    await page.goto('/surveys');

    // 匿名性に関する説明文を確認
    const anonymityTexts = [
      '完全匿名',
      '匿名',
      '個人を特定',
      '個人情報',
      'プライバシー'
    ];

    let foundAnonymityMessage = false;
    for (const text of anonymityTexts) {
      const element = page.locator(`text=/${text}/i`);
      if (await element.isVisible({ timeout: 5000 }).catch(() => false)) {
        foundAnonymityMessage = true;
        break;
      }
    }

    expect(foundAnonymityMessage).toBeTruthy();

    // 調査開始画面でも匿名性の説明があるか確認
    const surveyCard = page.locator("h3").locator("..").first();
    if (await surveyCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      const startButton = surveyCard.locator('a:has-text("調査を開始")');
      await startButton.click();

      // 調査画面でも匿名性に関する説明があるか確認
      let foundInSurvey = false;
      for (const text of anonymityTexts) {
        const element = page.locator(`text=/${text}/i`);
        if (await element.isVisible({ timeout: 5000 }).catch(() => false)) {
          foundInSurvey = true;
          break;
        }
      }

      // 少なくともどこかに匿名性の説明があること
      expect(foundAnonymityMessage || foundInSurvey).toBeTruthy();
    }
  });

  test('ブラウザの戻るボタンで回答履歴が残らないことを確認', async ({ page }) => {
    // 調査を開始
    await page.goto('/surveys');

    const surveyCard = page.locator("h3").locator("..").first();
    await surveyCard.waitFor({ state: 'visible' });

    const startButton = surveyCard.locator('a:has-text("調査を開始")');
    await startButton.click();

    // 質問に回答
    const input = page.locator('input:visible, textarea:visible').first();
    if (await input.isVisible({ timeout: 5000 }).catch(() => false)) {
      const inputType = await input.getAttribute('type');
      if (inputType === 'radio' || inputType === 'checkbox') {
        await input.check();
      } else {
        await input.fill('テスト回答');
      }
    }

    // 調査一覧に戻る
    await page.goBack();
    await page.waitForURL('/surveys');

    // 再度同じ調査を開始
    const newSurveyCard = page.locator("h3").locator("..").first();
    await newSurveyCard.waitFor({ state: 'visible' });

    const newStartButton = newSurveyCard.locator('a:has-text("調査を開始")');
    await newStartButton.click();

    // 前の回答が残っていないことを確認
    const newInput = page.locator('input:visible, textarea:visible').first();
    if (await newInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      const inputType = await newInput.getAttribute('type');
      if (inputType === 'radio' || inputType === 'checkbox') {
        await expect(newInput).not.toBeChecked();
      } else {
        const value = await newInput.inputValue();
        expect(value).toBe('');
      }
    }
  });
});