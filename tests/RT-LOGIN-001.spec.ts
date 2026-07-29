import { test, expect } from '@playwright/test';
import { dismissCookieBanner } from '../helpers/login';

/**
 * RT-LOGIN-001 – Successful Login with Valid Credentials
 *
 * Selectors bevestigd uit eerdere Codegen-opnames en projectcontext:
 * - Cookiebanner: "Deny all"
 * - Emailveld: bevestigd via role textbox name "Username" (zie ook #P9999_USERNAME)
 * - Wachtwoordveld: #P9999_PASSWORD
 * - Login-knop: "Sign in"
 */

test.describe('RT-LOGIN-001 – Successful Login with Valid Credentials', () => {
  test('user can log in with valid credentials', async ({ page }) => {
    await page.goto('https://app-qa.nbn.be/data/r/platform/frontend/login');
    await dismissCookieBanner(page);

    await page.getByRole('textbox', { name: 'Username' }).fill(process.env.NBN_QA_EMAIL!);
    await page.locator('#P9999_PASSWORD').fill(process.env.NBN_QA_PASSWORD!);
    await page.getByRole('button', { name: 'Sign in' }).click();

    // --- Assertions (Expected Result) ---

    // Gebruiker wordt doorgestuurd naar de juiste landingspagina
    await expect(page).toHaveURL(/\/frontend\/home/);

    // Gebruikersnaam wordt getoond in de header ("Hello <naam>")
    // Generiek gehouden: controleert enkel dat er een naam verschijnt na
    // "Hello", niet welke specifieke naam — zodat dit werkt ongeacht welk
    // testaccount er gebruikt wordt (env-variabelen kunnen wijzigen).
    await expect(page.getByText(/Hello\s+\w+/)).toBeVisible();
  });
});
// paste dit in de terminal om de test te draaien: npx playwright test tests/RT-LOGIN-001.spec.ts --project=chromium