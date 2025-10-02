import { test } from '@playwright/test';

test('Simple login test with step-by-step debugging', async ({ page }) => {
  // Capture all console messages
  const consoleMessages: string[] = [];
  page.on('console', msg => {
    const message = `[${msg.type()}] ${msg.text()}`;
    consoleMessages.push(message);
    console.log('🖥️  CONSOLE:', message);
  });
  // Step 1: Navigate to login
  console.log('📍 Step 1: Navigate to login page');
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Step 2: Check initial localStorage
  console.log('📍 Step 2: Check initial localStorage');
  const initialStorage = await page.evaluate(() => {
    return localStorage.getItem('auth-storage');
  });
  console.log('💾 Initial localStorage:', initialStorage);

  // Step 3: Check and click HR Manager login
  console.log('📍 Step 3: Check HR Manager button');
  const hrButtons = await page.locator('button:has-text("HR Manager")').count();
  console.log('🔘 HR Manager buttons found:', hrButtons);

  if (hrButtons > 0) {
    console.log('📍 Clicking HR Manager button');
    await page.click('button:has-text("HR Manager")');
  } else {
    console.log('❌ No HR Manager button found, checking all buttons');
    const allButtons = await page.locator('button').all();
    for (let i = 0; i < allButtons.length; i++) {
      const text = await allButtons[i].textContent();
      console.log(`🔘 Button ${i}: "${text}"`);
    }
  }

  await page.waitForTimeout(3000); // Give time for state updates

  // Step 4: Check localStorage after login
  console.log('📍 Step 4: Check localStorage after login');
  const afterLoginStorage = await page.evaluate(() => {
    return localStorage.getItem('auth-storage');
  });
  console.log('💾 After login localStorage:', afterLoginStorage);

  // Step 5: Check current URL
  const currentUrl = page.url();
  console.log('📍 Current URL:', currentUrl);

  // Step 6: Manually navigate to questions page
  console.log('📍 Step 6: Navigate to questions page');
  await page.goto('/admin/questions');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // Step 7: Check final URL and localStorage
  const finalUrl = page.url();
  const finalStorage = await page.evaluate(() => {
    return localStorage.getItem('auth-storage');
  });

  console.log('📍 Final URL:', finalUrl);
  console.log('💾 Final localStorage:', finalStorage);

  // Step 8: Check if any buttons are visible
  const createButtonCount = await page.locator('button:has-text("新しい質問を作成")').count();
  console.log('🔘 Create button count:', createButtonCount);
});