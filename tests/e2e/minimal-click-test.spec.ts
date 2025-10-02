import { test } from '@playwright/test';

test('Minimal click test to isolate the issue', async ({ page }) => {
  // Capture errors
  const errors: string[] = [];
  page.on('pageerror', err => {
    errors.push(`PAGE ERROR: ${err.message}`);
    console.log('🚨 PAGE ERROR:', err.message);
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('🚨 CONSOLE ERROR:', msg.text());
    } else {
      console.log(`📝 ${msg.type()}: ${msg.text()}`);
    }
  });

  console.log('📍 Navigate to login');
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  console.log('📍 Look for ALL elements with HR Manager text');
  const hrElements = await page.locator('text="HR Manager"').all();
  console.log(`🔍 Found ${hrElements.length} elements with "HR Manager" text`);

  for (let i = 0; i < hrElements.length; i++) {
    const tagName = await hrElements[i].evaluate(el => el.tagName);
    const className = await hrElements[i].evaluate(el => el.className);
    console.log(`  ${i}: <${tagName}> class="${className}"`);
  }

  console.log('📍 Look for buttons specifically');
  const buttons = await page.locator('button').all();
  console.log(`🔘 Found ${buttons.length} buttons total`);

  for (let i = 0; i < buttons.length; i++) {
    const text = await buttons[i].textContent();
    const type = await buttons[i].getAttribute('type');
    console.log(`  Button ${i}: type="${type}" text="${text?.trim()}"`);
  }

  console.log('📍 Try clicking with different selector');
  await page.click('text="HR Manager"');
  await page.waitForTimeout(2000);

  const url = page.url();
  console.log('📍 URL after click:', url);

  if (errors.length > 0) {
    console.log('🚨 JavaScript Errors Detected:');
    errors.forEach(error => console.log('  -', error));
  } else {
    console.log('✅ No JavaScript errors detected');
  }
});