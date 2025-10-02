import { test } from '@playwright/test';

test('Debug network requests during question creation', async ({ page }) => {
  // Capture all network requests
  const requests: any[] = [];
  const responses: any[] = [];

  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      headers: request.headers(),
      postData: request.postData()
    });
    console.log(`📤 Request: ${request.method()} ${request.url()}`);
  });

  page.on('response', response => {
    responses.push({
      url: response.url(),
      status: response.status(),
      statusText: response.statusText()
    });
    console.log(`📥 Response: ${response.status()} ${response.url()}`);
  });

  // Login as HR Manager
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  // Click the HR Manager button (Button index 2 based on our discovery)
  await page.locator('button').nth(2).click();
  await page.waitForURL('**/admin');
  await page.waitForTimeout(1000);

  // Navigate to questions page
  await page.goto('/admin/questions');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Check what's actually on the page
  const pageTitle = await page.title();
  const hasButton = await page.locator('button:has-text("新しい質問を作成")').count();
  const hasError = await page.locator('.bg-red-50').count();

  console.log(`📄 Page title: ${pageTitle}`);
  console.log(`🔘 Create button count: ${hasButton}`);
  console.log(`❌ Error count: ${hasError}`);

  if (hasError > 0) {
    const errorTexts = await page.locator('.bg-red-50').allTextContents();
    console.log(`🚨 Error messages: ${errorTexts.join(', ')}`);
  }

  // Clear captured requests to focus on form submission
  requests.length = 0;
  responses.length = 0;

  console.log('🔄 Starting form submission flow...');

  if (hasButton > 0) {
    // Open modal
    await page.locator('button:has-text("新しい質問を作成")').first().click();
    await page.waitForTimeout(1000);

    // Fill form
    await page.locator('textarea[placeholder*="質問を入力"]').fill('Network Debug Test Question');
    await page.locator('select').first().selectOption('A');
    await page.locator('select').nth(1).selectOption('text');
    await page.locator('input[type="checkbox"]').check();

    console.log('📝 Form filled, submitting...');

    // Submit form and capture network activity
    await page.locator('button:has-text("作成")').click();
    await page.waitForTimeout(5000);
  } else {
    console.log('❌ No create button found, cannot test form submission');
  }

  console.log(`\n📊 Network Activity Summary:`);
  console.log(`Total requests: ${requests.length}`);
  console.log(`Total responses: ${responses.length}`);

  // Log all API requests
  const apiRequests = requests.filter(req => req.url.includes('/api/'));
  console.log(`\n🔌 API Requests (${apiRequests.length}):`);
  apiRequests.forEach((req, index) => {
    console.log(`${index + 1}. ${req.method} ${req.url}`);
    if (req.postData) {
      console.log(`   Body: ${req.postData}`);
    }
  });

  // Log all API responses
  const apiResponses = responses.filter(res => res.url.includes('/api/'));
  console.log(`\n📨 API Responses (${apiResponses.length}):`);
  apiResponses.forEach((res, index) => {
    console.log(`${index + 1}. ${res.status} ${res.statusText} ${res.url}`);
  });
});