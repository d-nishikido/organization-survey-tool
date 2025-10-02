import { test, expect } from '@playwright/test';

test('Debug authentication and component rendering flow', async ({ page }) => {
  // Capture console errors and logs
  const consoleMessages: string[] = [];
  const errors: string[] = [];

  page.on('console', msg => {
    consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
    if (msg.type() === 'error' && !msg.text().includes('favicon')) {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    errors.push(`PAGE ERROR: ${err.message}`);
  });

  console.log('🔍 Step 1: Navigate to login page');
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  console.log('🔍 Step 2: Check authentication state before login');
  const authStateBefore = await page.evaluate(() => {
    // Access the auth store directly
    const store = (window as any).__authStore;
    return {
      isAuthenticated: store?.getState?.()?.isAuthenticated || false,
      user: store?.getState?.()?.user || null,
      isLoading: store?.getState?.()?.isLoading || false
    };
  });
  console.log('📊 Auth state before login:', authStateBefore);

  console.log('🔍 Step 3: Perform HR Manager login');
  await page.click('button:has-text("HR Manager")');
  await page.waitForTimeout(2000);

  console.log('🔍 Step 4: Check authentication state after login');
  const authStateAfter = await page.evaluate(() => {
    // Check localStorage for persisted auth data
    const authStorage = localStorage.getItem('auth-storage');
    console.log('localStorage auth-storage:', authStorage);

    // Try to access zustand store from window (if available)
    const store = (window as any).__authStore;
    return {
      isAuthenticated: store?.getState?.()?.isAuthenticated || false,
      user: store?.getState?.()?.user || null,
      isLoading: store?.getState?.()?.isLoading || false,
      localStorage: authStorage ? JSON.parse(authStorage) : null
    };
  });
  console.log('📊 Auth state after login:', authStateAfter);

  console.log('🔍 Step 5: Check current URL and page content');
  const currentUrl = page.url();
  const pageTitle = await page.title();
  console.log(`📍 Current URL: ${currentUrl}`);
  console.log(`📄 Page title: ${pageTitle}`);

  // Check if we're on the admin page
  const adminHeader = await page.locator('h1:has-text("管理画面")').count();
  console.log(`🏠 Admin header count: ${adminHeader}`);

  console.log('🔍 Step 6: Navigate directly to questions page');
  await page.goto('/admin/questions');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  console.log('🔍 Step 7: Check final page state');
  const finalUrl = page.url();
  const finalTitle = await page.title();
  console.log(`📍 Final URL: ${finalUrl}`);
  console.log(`📄 Final title: ${finalTitle}`);

  // Check for key elements
  const questionHeader = await page.locator('h1:has-text("質問管理")').count();
  const createButton = await page.locator('button:has-text("新しい質問を作成")').count();
  const searchInput = await page.locator('input[placeholder*="質問を検索"]').count();
  const errorElements = await page.locator('.bg-red-50').count();

  console.log(`📋 Question header count: ${questionHeader}`);
  console.log(`🔘 Create button count: ${createButton}`);
  console.log(`🔍 Search input count: ${searchInput}`);
  console.log(`❌ Error elements count: ${errorElements}`);

  // Check if we're being redirected due to authentication issues
  if (finalUrl.includes('/login')) {
    console.log('🚨 ISSUE: Redirected back to login - authentication problem');
  } else if (finalUrl.includes('/unauthorized')) {
    console.log('🚨 ISSUE: Redirected to unauthorized - role permission problem');
  } else if (finalUrl.includes('/admin/questions')) {
    console.log('✅ Correct URL reached');
    if (questionHeader === 0) {
      console.log('🚨 ISSUE: Component not rendering - check React component tree');
    }
  }

  console.log('\n📊 Console Messages Summary:');
  consoleMessages.forEach((msg, index) => {
    if (index < 10) { // Show first 10 messages
      console.log(`  ${index + 1}. ${msg}`);
    }
  });

  console.log('\n🚨 Error Summary:');
  if (errors.length === 0) {
    console.log('  No JavaScript errors detected');
  } else {
    errors.forEach((error, index) => {
      console.log(`  ${index + 1}. ${error}`);
    });
  }
});