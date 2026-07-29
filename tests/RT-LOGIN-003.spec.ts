import { test, expect } from '@playwright/test';
import { dismissCookieBanner } from '../helpers/login';

/**
 * RT-LOGIN-003 – Login with Non-Existing Email Address
 */

test.describe('RT-LOGIN-003 – Login with Non-Existing Email Address', () => {
  test('login is denied with a non-existing email address', async ({ page }) => {
    await page.goto('https://app-qa.nbn.be/data/r/platform/frontend/login');
    await dismissCookieBanner(page);

    const nonExistingEmail = `does.not.exist.${Date.now()}@nbn.be`;

    await page.getByRole('textbox', { name: 'Username' }).fill(nonExistingEmail);
    await page.locator('#P9999_PASSWORD').fill('AnyPassword123!');
    await page.getByRole('button', { name: 'Sign in' }).click();

    // --- Assertions (Expected Result) ---

    // Foutmelding wordt getoond (bevestigd 14/07: zelfde generieke tekst
    // als RT-LOGIN-002 — het systeem maakt bewust geen onderscheid tussen
    // "verkeerd wachtwoord" en "e-mail bestaat niet", vermoedelijk om niet
    // te lekken welke e-mailadressen geregistreerd zijn)
    await expect(page.getByText('Invalid Login Credentials')).toBeVisible();

    // Gebruiker blijft op de loginpagina
    await expect(page).toHaveURL(/login/);
  });
});
// paste dit in de terminal om de test te draaien: npx playwright test tests/RT-LOGIN-003.spec.ts --project=chromium