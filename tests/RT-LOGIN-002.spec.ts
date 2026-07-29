import { test, expect } from '@playwright/test';
import { dismissCookieBanner } from '../helpers/login';

/**
 * RT-LOGIN-002 – Login with Invalid Password
 */

test.describe('RT-LOGIN-002 – Login with Invalid Password', () => {
  test('login is denied with an incorrect password', async ({ page }) => {
    await page.goto('https://app-qa.nbn.be/data/r/platform/frontend/login');
    await dismissCookieBanner(page);

    await page.getByRole('textbox', { name: 'Username' }).fill(process.env.NBN_QA_EMAIL!);
    await page.locator('#P9999_PASSWORD').fill('DefinitelyWrongPassword123!');
    await page.getByRole('button', { name: 'Sign in' }).click();

    // --- Assertions (Expected Result) ---

    // Foutmelding wordt getoond (generieke melding, geen onderscheid
    // tussen "verkeerd wachtwoord" en "e-mail bestaat niet" — bevestigd 14/07)
    await expect(page.getByText('Invalid Login Credentials')).toBeVisible();

    // Gebruiker blijft op de loginpagina
    await expect(page).toHaveURL(/login/);
  });
});
// paste dit in de terminal om de test te draaien: npx playwright test tests/RT-LOGIN-002.spec.ts --project=chromium