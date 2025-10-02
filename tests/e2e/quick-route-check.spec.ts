import { test, expect } from '@playwright/test';

test('Quick route verification', async ({ page }) => {
  // Set shorter timeouts
  page.setDefaultTimeout(10000);

  console.log('Checking route fix...');

  try {
    await page.goto('/debug/surveys/1/questions', { timeout: 10000 });

    // Give React time to render but don't wait too long
    await page.waitForTimeout(3000);

    // Quick checks
    const title = await page.locator('h1').textContent({ timeout: 5000 }) || '';
    console.log('Page title:', title);

    // Check for component indicators
    const hasSearch = await page.locator('input[placeholder="質問を検索..."]').count() > 0;
    const hasDebugBox = await page.locator('.bg-yellow-100').count() > 0;

    console.log('Has search input (real component):', hasSearch);
    console.log('Has debug box (debug component):', hasDebugBox);

    if (hasSearch && !hasDebugBox) {
      console.log('✅ SUCCESS: Route fix worked - real component loads');
    } else if (!hasSearch && hasDebugBox) {
      console.log('❌ FAILED: Still loading debug component');
    } else if (!hasSearch && !hasDebugBox) {
      console.log('❓ Neither component detected - possible error state');
      // Check if there's an error
      const content = await page.content();
      console.log('Page content length:', content.length);
      if (content.includes('Error') || content.includes('エラー')) {
        console.log('❌ Error found on page');
      }
    }

    // Assert the fix worked
    expect(hasSearch).toBe(true);
    expect(hasDebugBox).toBe(false);

  } catch (error) {
    console.error('Test failed with error:', error);
    throw error;
  }
});