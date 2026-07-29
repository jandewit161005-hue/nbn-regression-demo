import { test, expect } from '@playwright/test';

test('login to NBN QA portal', async ({ page }) => {
  await page.goto('https://app-qa.nbn.be/data/r/platform/frontend/login');

  await page.getByRole('button', { name: /deny all/i }).click();

  await page.getByPlaceholder('EMAIL').fill(process.env.NBN_TEST_EMAIL!);
  await page.getByPlaceholder('Password').fill(process.env.NBN_TEST_PASSWORD!);
  await page.getByRole('button', { name: /log in|sign in|inloggen/i }).click();

  await expect(page).toHaveURL('https://app-qa.nbn.be/data/r/platform/frontend/home');
});