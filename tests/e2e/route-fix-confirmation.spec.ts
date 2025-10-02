import { test, expect } from '@playwright/test';

test('Route fix confirmation', async ({ page }) => {
  console.log('=== ROUTE FIX VERIFICATION ===');

  // Test the debug route
  await page.goto('/debug/surveys/1/questions');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);

  // Check what component loaded
  const hasSearchInput = await page.locator('input[placeholder="質問を検索..."]').count() > 0;
  const hasDebugBox = await page.locator('.bg-yellow-100').count() > 0;
  const titleText = await page.locator('h1').textContent() || '';

  console.log('Debug route (/debug/surveys/1/questions):');
  console.log('- Page title:', titleText);
  console.log('- Has search input (real component):', hasSearchInput);
  console.log('- Has debug box (debug component):', hasDebugBox);

  if (hasSearchInput && !hasDebugBox) {
    console.log('✅ SUCCESS: Debug route now loads REAL component');
  } else if (!hasSearchInput && hasDebugBox) {
    console.log('❌ FAILED: Debug route still loads debug component');
  } else {
    console.log('❓ UNEXPECTED: Neither or both components detected');
  }

  // The fix should make debug route load the real component
  expect(hasSearchInput).toBe(true);
  expect(hasDebugBox).toBe(false);
  expect(titleText).toContain('質問割り当て');
  expect(titleText).not.toContain('デバッグ版');

  console.log('=== ROUTE FIX VERIFIED ===');
});