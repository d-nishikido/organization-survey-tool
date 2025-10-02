import { test } from '@playwright/test';

test('Fixed login test with correct button click', async ({ page }) => {
  // Capture all console messages and errors
  page.on('console', msg => {
    console.log(`🖥️  [${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', err => {
    console.log('🚨 PAGE ERROR:', err.message);
    console.log('🚨 STACK:', err.stack);
  });

  console.log('📍 Step 1: Navigate to login page');
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  console.log('📍 Step 2: Check initial localStorage');
  const initialStorage = await page.evaluate(() => {
    return localStorage.getItem('auth-storage');
  });
  console.log('💾 Initial localStorage:', initialStorage);

  // Use the correct selector to click the button, not the text
  console.log('📍 Step 3: Click HR Manager button (Button 2)');
  const hrButton = page.locator('button').nth(2); // Based on our discovery: Button 2 is HR Manager
  await hrButton.click();
  await page.waitForTimeout(3000);

  console.log('📍 Step 4: Check localStorage after login');
  const afterLoginStorage = await page.evaluate(() => {
    return localStorage.getItem('auth-storage');
  });
  console.log('💾 After login localStorage:', afterLoginStorage);

  const currentUrl = page.url();
  console.log('📍 Current URL after login:', currentUrl);

  console.log('📍 Step 5: Navigate to questions page');
  await page.goto('/admin/questions');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  const finalUrl = page.url();
  const finalStorage = await page.evaluate(() => {
    return localStorage.getItem('auth-storage');
  });

  console.log('📍 Final URL:', finalUrl);
  console.log('💾 Final localStorage:', finalStorage);

  // Check if the QuestionManagement component is now visible
  const createButtonCount = await page.locator('button:has-text("新しい質問を作成")').count();
  const questionHeader = await page.locator('h1:has-text("質問管理")').count();

  console.log('🔘 Create button count:', createButtonCount);
  console.log('📋 Question header count:', questionHeader);

  // Success criteria
  if (finalUrl.includes('/admin/questions') && createButtonCount > 0) {
    console.log('🎉 SUCCESS: Authentication and component rendering working!');
  } else {
    console.log('❌ FAILED: Still issues with authentication or rendering');
  }
});