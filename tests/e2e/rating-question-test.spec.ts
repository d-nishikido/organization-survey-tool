import { test, expect } from '@playwright/test';

test.describe('Rating Question Type', () => {
  test('should handle rating_5 question type without errors', async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:5173');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check that the page doesn't show the unsupported question type error
    const errorMessage = page.locator('text=/サポートされていない質問タイプです.*rating_5/');

    // The error message should not be visible
    await expect(errorMessage).not.toBeVisible();

    // If there's a rating question on the page, verify it's rendered correctly
    const ratingButtons = page.locator('button[aria-label*="評価"]');
    const count = await ratingButtons.count();

    if (count > 0) {
      // Should have 5 rating buttons (1-5)
      expect(count).toBe(5);

      // Test clicking a rating button
      await ratingButtons.nth(2).click(); // Click rating 3

      // Verify the button is selected (has the active styling)
      await expect(ratingButtons.nth(2)).toHaveClass(/bg-blue-500/);
    }
  });
});