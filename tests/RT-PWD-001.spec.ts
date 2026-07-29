import { test, expect } from '@playwright/test';
import { dismissCookieBanner } from '../helpers/login';

/**
 * RT-PWD-001 – Request Password Reset
 *
 * Selectors bevestigd via codegen-opname (14/07... zie sessie):
 * - Link "Forgot password?" (kleine p) op de loginpagina
 * - E-mailveld op de reset-pagina heeft dezelfde accessible name als het
 *   loginveld: "Username" (hergebruikt component, geen apart "Email"-veld)
 * - Knop heet "Submit" (niet "Send Verification Code" zoals de testspec suggereert)
 * - Volgend scherm toont een titel "Verification code" en de tekst
 *   "Please enter the verification code we sent to your email address."
 *
 * Gebruikt process.env.NBN_QA_EMAIL, ervan uitgaand dat dit een bestaand,
 * actief account is (precondition: "user has an active account").
 */

test.describe('RT-PWD-001 – Request Password Reset', () => {
  test('a verification code is requested and a confirmation message is shown', async ({ page }) => {
    await page.goto('https://app-qa.nbn.be/data/r/platform/frontend/login');
    await dismissCookieBanner(page);

    // Stap 2: Forgot password?
    await page.getByRole('link', { name: 'Forgot password?' }).click();

    // Stap 3: e-mailadres invullen (zelfde veldnaam "Username" als op login)
    await page.getByRole('textbox', { name: 'Username' }).fill(process.env.NBN_QA_EMAIL!);

    // Stap 4: code aanvragen
    await page.getByRole('button', { name: 'Submit' }).click();

    // --- Assertions (Expected Result) ---

    // Confirmatiescherm: titel + instructietekst
    // LET OP: gewone getByText('Verification code') is dubbelzinnig — zowel
    // de <h1>-titel als het label van het codeveld (#P10003_VERIFICATION_CODE)
    // bevatten exact deze tekst (strict-mode violation, bevestigd bij testrun).
    // Daarom expliciet op de heading-rol mikken.
    await expect(page.getByRole('heading', { name: 'Verification code' })).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByText('Please enter the verification code we sent to your email address.')
    ).toBeVisible();
  });
});
// paste dit in de terminal om de test te draaien: npx playwright test tests/RT-PWD-001.spec.ts --project=chromium