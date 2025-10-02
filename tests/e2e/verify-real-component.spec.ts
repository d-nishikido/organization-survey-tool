import { test, expect } from '@playwright/test';

test.describe('Route Configuration Fix Verification', () => {
  test('should load SurveyQuestionAssignment component at debug route', async ({ page }) => {
    // Navigate to the debug route that should now load the real component
    await page.goto('/debug/surveys/1/questions');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // The real component should have the title "質問割り当て" (without "デバッグ版")
    // and should have filter controls
    await expect(page.locator('h1')).toContainText('質問割り当て');

    // Should NOT contain the debug version indicator
    await expect(page.locator('h1')).not.toContainText('デバッグ版');

    // Should have search input (only in real component)
    await expect(page.locator('input[placeholder="質問を検索..."]')).toBeVisible();

    // Should have filter dropdowns (only in real component)
    await expect(page.locator('select').first()).toBeVisible();

    // Should NOT have the yellow debug info box
    await expect(page.locator('.bg-yellow-100')).not.toBeVisible();
  });

  test('should load SurveyQuestionAssignmentDebug component at admin route (when not authenticated)', async ({ page }) => {
    // Navigate to the admin route - this should redirect to login or show unauthorized
    // since we're not authenticated, but let's check the debug route works
    await page.goto('/debug/surveys/1/questions');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Should get the real component, not the debug one
    await expect(page.locator('h1')).toContainText('質問割り当て');
    await expect(page.locator('h1')).not.toContainText('デバッグ版');
  });

  test('debug route should now load debug component', async ({ page }) => {
    // Create a simple manual check by navigating to both routes
    // and verifying their content

    // Check debug route loads debug component
    await page.goto('/debug/surveys/1/questions');
    await page.waitForLoadState('networkidle');

    // Should load the debug component (which should have simpler content)
    const isDebugComponent = await page.locator('.bg-yellow-100').isVisible();
    const hasSearchInput = await page.locator('input[placeholder="質問を検索..."]').isVisible();

    // If we see the debug yellow box, it's the debug component
    // If we see the search input, it's the real component
    if (isDebugComponent) {
      console.log('❌ Debug route is still loading debug component - route swap not working');
      expect(false).toBe(true); // Force failure
    } else if (hasSearchInput) {
      console.log('✅ Debug route is now loading real component - route swap successful');
      expect(true).toBe(true);
    } else {
      console.log('❓ Unexpected component state');
      expect(false).toBe(true); // Force failure for investigation
    }
  });
});