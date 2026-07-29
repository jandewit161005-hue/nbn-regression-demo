import { test, expect } from '@playwright/test';
import 'dotenv/config';

const EMAIL = process.env.NBN_QA_EMAIL || '';
const PASSWORD = process.env.NBN_QA_PASSWORD || '';
const LOGIN_URL = 'https://app-qa.nbn.be/data/r/platform/frontend/login';
const CATALOGUE_URL = 'https://app-qa.nbn.be/data/r/platform/frontend/all-standards?lang=en';
const NORM_QUERY = 'NBN EN 1090';

test('login, norm opzoeken via catalogus, detailpagina bekijken', async ({ page }) => {
  test.setTimeout(60_000);

  // --- Login ---
  await page.goto(LOGIN_URL, { waitUntil: 'networkidle' });
  const denyButton = page.getByRole('button', { name: 'Deny all' });
  if (await denyButton.isVisible().catch(() => false)) {
    await denyButton.click();
  }
  await page.locator('#P9999_USERNAME').fill(EMAIL);
  await page.locator('#P9999_PASSWORD').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(/home/, { timeout: 15000 });

  // --- Naar catalogus, zoeken ---
  await page.goto(CATALOGUE_URL, { waitUntil: 'networkidle' });
  await page.locator('#P20_SEARCH').fill(NORM_QUERY);
  await page.locator('#P20_SEARCH').press('Enter');
  await page.waitForLoadState('networkidle');

  await page.screenshot({ path: 'result-search.png', fullPage: true });
  console.log('URL na zoeken:', page.url());

  // --- Klik op het resultaat ---
  const resultLink = page.getByText(NORM_QUERY).first();
  await expect(resultLink).toBeVisible({ timeout: 10000 });
  await resultLink.click();
  await page.waitForLoadState('networkidle');

  console.log('URL detailpagina:', page.url());
  await page.screenshot({ path: 'result-detail.png', fullPage: true });

  const bodyText = await page.locator('body').innerText();
  console.log('\n=== TEKST DETAILPAGINA ===');
  console.log(bodyText.slice(0, 1500));
});