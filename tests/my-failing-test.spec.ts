import { test, expect } from '@playwright/test';
test ( 'this should fail', async ({ page }) => {
  await page.goto('https://playwright.dev/');
  await expect(page).toHaveURL(/Nonsense123/);
});