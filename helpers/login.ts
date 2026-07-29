import { Page } from '@playwright/test';

/**
 * Centrale login-helper voor de NBN QA-omgeving (Oracle APEX).
 * Selectors zijn bevestigd werkend op https://app-qa.nbn.be/data/r/platform/frontend/login
 *
 * Gebruik:
 *   await login(page, process.env.NBN_QA_EMAIL!, process.env.NBN_QA_PASSWORD!);
 *
 * Voor tests die als Company Administrator moeten inloggen, geef gewoon
 * de admin-credentials mee als parameters (bv. uit .env als
 * NBN_QA_ADMIN_EMAIL / NBN_QA_ADMIN_PASSWORD).
 */
export async function login(page: Page, email: string, password: string) {
  await page.goto('https://app-qa.nbn.be/data/r/platform/frontend/login');

  // Cookiebanner wegklikken indien aanwezig (niet altijd zichtbaar, dus tolerant)
  const denyAllButton = page.getByText('Deny all', { exact: true });
  if (await denyAllButton.isVisible().catch(() => false)) {
    await denyAllButton.click();
  }

  await page.locator('#P9999_USERNAME').fill(email);
  await page.locator('#P9999_PASSWORD').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  // Wachten op een concreet, herkenbaar post-login signaal i.p.v. networkidle.
  // networkidle bleek traag/onbetrouwbaar op deze site (tot 20+ seconden,
  // vermoedelijk door achtergrond-netwerkverkeer dat nooit echt stilvalt),
  // wat testtimeouts veroorzaakte in latere stappen (bevestigd 14/07).
  await page.waitForURL(/\/frontend\/home/, { timeout: 15000 });
}

/**
 * Cookiebanner los wegklikken, voor pagina's waar je niet via login() binnenkomt
 * (bv. rechtstreeks naar de registratiepagina navigeren).
 */
export async function dismissCookieBanner(page: Page) {
  const denyAllButton = page.getByText('Deny all', { exact: true });
  if (await denyAllButton.isVisible().catch(() => false)) {
    await denyAllButton.click();
  }
}