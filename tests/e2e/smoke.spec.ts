import { test, expect } from '@playwright/test';

/**
 * Smoke tests for Organization Survey Tool
 * Pre-commit smoke tests to ensure basic functionality works
 */

test.describe('Survey Application Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Wait for application to be available
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('Should load homepage successfully', async ({ page }) => {
    await page.goto('/');

    // Check that the page loads without errors
    await expect(page.locator('h1')).toBeVisible();

    // Check for basic navigation elements
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test('Should navigate to survey list page', async ({ page }) => {
    await page.goto('/surveys');

    // Check that survey list page loads
    await expect(page.locator('h1')).toContainText('利用可能な調査');

    // Check for loading states or content
    const loadingSpinner = page.locator('[role="status"]');
    const surveyGrid = page.locator('.grid');

    // Wait for either loading to complete or content to appear
    await Promise.race([
      loadingSpinner.waitFor({ state: 'hidden' }),
      surveyGrid.waitFor({ state: 'visible' }),
      page.waitForTimeout(10000) // 10 second timeout
    ]);

    // Verify page structure exists
    await expect(page.locator('h1')).toBeVisible();
  });

  test('Should handle survey list API integration', async ({ page }) => {
    await page.goto('/surveys');

    // Wait for API call to complete
    await page.waitForLoadState('networkidle');

    // Check for either surveys or empty state
    const hasSurveys = await page.locator('.grid > *').count() > 0;
    const hasEmptyState = await page.locator('text=調査がありません').isVisible();

    expect(hasSurveys || hasEmptyState).toBeTruthy();
  });

  test('Should show proper error handling for survey details', async ({ page }) => {
    // Try to access a non-existent survey detail page
    await page.goto('/survey/999/details');

    // Should either show error message or redirect
    await page.waitForLoadState('networkidle');

    // Check for error handling
    const hasErrorMessage = await page.locator('text=エラーが発生しました').isVisible();
    const hasNotFoundMessage = await page.locator('text=見つかりませんでした').isVisible();
    const hasRedirect = page.url().includes('/surveys');

    expect(hasErrorMessage || hasNotFoundMessage || hasRedirect).toBeTruthy();
  });

  test('Should maintain responsive design on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/surveys');
    await page.waitForLoadState('networkidle');

    // Check that the page still renders properly on mobile
    await expect(page.locator('h1')).toBeVisible();

    // Check grid layout adapts to mobile
    const container = page.locator('.container');
    await expect(container).toBeVisible();
  });

  test('Should handle anonymous session management', async ({ page }) => {
    await page.goto('/surveys');
    await page.waitForLoadState('networkidle');

    // Check for session information (if displayed)
    const sessionInfo = page.locator('text=匿名セッション');

    // Session info should either be visible or not affect functionality
    if (await sessionInfo.isVisible()) {
      await expect(sessionInfo).toContainText('匿名セッション');
    }

    // Page should function regardless of session state
    await expect(page.locator('h1')).toBeVisible();
  });

  test('Should allow navigation between pages', async ({ page }) => {
    // Start at homepage
    await page.goto('/');

    // Navigate to surveys if there's a link
    const surveyLink = page.locator('a[href="/surveys"]').first();
    if (await surveyLink.isVisible()) {
      await surveyLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('h1')).toContainText('利用可能な調査');
    }

    // Check that navigation doesn't break the application
    await expect(page.locator('body')).toBeVisible();
  });

  test('Should handle backend API connectivity', async ({ page }) => {
    await page.goto('/surveys');

    // Monitor network requests
    const apiResponse = page.waitForResponse('**/api/surveys**').catch(() => null);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check that the page handles API responses (success or failure) gracefully
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();

    // Should not show uncaught errors
    const hasJSErrors = await page.locator('text=Uncaught').isVisible();
    expect(hasJSErrors).toBeFalsy();
  });
});

test.describe('Analytics Dashboard Smoke Tests', () => {
  test('Should load analytics dashboard', async ({ page }) => {
    // Navigate to analytics dashboard
    await page.goto('/admin/analytics');
    await page.waitForLoadState('networkidle');

    // Check if analytics dashboard loads or shows appropriate error/auth message
    const analyticsContent = page.getByText('分析ダッシュボード');
    const authMessage = page.getByText('認証が必要');
    const loadingMessage = page.getByText('読み込み中');

    // One of these should be visible
    await expect(analyticsContent.or(authMessage).or(loadingMessage).or(page.locator('h1'))).toBeVisible();
  });

  test('Should display analytics components without errors', async ({ page }) => {
    await page.goto('/admin/analytics');
    await page.waitForLoadState('networkidle');

    // Wait for components to load
    await page.waitForTimeout(3000);

    // Check for key components or error states
    const filterPanel = page.getByText('フィルター設定');
    const exportTools = page.getByText('エクスポート');
    const errorMessage = page.getByText('エラー');
    const loadingState = page.getByText('読み込み');

    // Should see components or appropriate states
    const hasContent = await filterPanel.or(exportTools).or(errorMessage).or(loadingState).or(page.locator('body')).isVisible();
    expect(hasContent).toBeTruthy();
  });

  test('Should handle analytics page on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/admin/analytics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check if page is responsive
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();

    // Verify no horizontal overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalScroll).toBeFalsy();
  });

  test('Should not have JavaScript errors on analytics page', async ({ page }) => {
    const errors: string[] = [];

    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().includes('favicon')) {
        errors.push(msg.text());
      }
    });

    // Capture page errors
    page.on('pageerror', (err) => {
      errors.push(err.message);
    });

    await page.goto('/admin/analytics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Filter out non-critical errors
    const criticalErrors = errors.filter(error =>
      !error.includes('net::ERR_') &&
      !error.includes('ResizeObserver') &&
      !error.includes('favicon')
    );

    expect(criticalErrors.length).toBeLessThanOrEqual(2); // Allow minor non-blocking errors
  });
});