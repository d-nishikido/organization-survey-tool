import { test, expect } from '@playwright/test';

test.describe('Login Role-Based Redirect Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:5173/login');
    await page.waitForLoadState('networkidle');
  });

  test('HR Manager should redirect to admin dashboard', async ({ page }) => {
    // Click HR Manager demo login
    await page.click('button:has-text("HR Manager")');

    // Wait for navigation
    await page.waitForURL('**/admin');

    // Verify we're on the admin dashboard
    await expect(page).toHaveURL(/.*\/admin/);
    await expect(page.locator('h1:text("管理ダッシュボード")')).toBeVisible();
    await expect(page.locator('text=組織調査ツールの管理画面へようこそ')).toBeVisible();
  });

  test('System Admin should redirect to admin dashboard', async ({ page }) => {
    // Click System Admin demo login
    await page.click('button:has-text("System Admin")');

    // Wait for navigation
    await page.waitForURL('**/admin');

    // Verify we're on the admin dashboard
    await expect(page).toHaveURL(/.*\/admin/);
    await expect(page.locator('h1:text("管理ダッシュボード")')).toBeVisible();
  });

  test('Employee should redirect to surveys page', async ({ page }) => {
    // Click Employee demo login
    await page.click('button:has-text("Employee")');

    // Wait for navigation
    await page.waitForURL('**/surveys');

    // Verify we're on the surveys page
    await expect(page).toHaveURL(/.*\/surveys/);
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/利用可能な調査|調査一覧/);
  });

  test('HR Manager quick actions should be visible on dashboard', async ({ page }) => {
    // Login as HR Manager
    await page.click('button:has-text("HR Manager")');
    await page.waitForURL('**/admin');

    // Check for HR-specific quick actions
    await expect(page.locator('text=新しい調査を作成')).toBeVisible();
    await expect(page.locator('text=結果を分析')).toBeVisible();
    await expect(page.locator('button:has-text("システム設定")').first()).toBeVisible();
  });

  test('Admin dashboard stats should be displayed', async ({ page }) => {
    // Login as HR Manager
    await page.click('button:has-text("HR Manager")');
    await page.waitForURL('**/admin');

    // Check for stats cards
    await expect(page.locator('text=アクティブ調査')).toBeVisible();
    await expect(page.locator('text=総回答数')).toBeVisible();
    await expect(page.locator('text=回答率')).toBeVisible();
    await expect(page.locator('text=平均回答時間')).toBeVisible();
  });
});