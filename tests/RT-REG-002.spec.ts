import { test, expect } from '@playwright/test';
import { generateTestUser } from '../helpers/testData';

/**
 * RT-REG-002 – Email Validation with an Invalid Code
 *
 * Objective: Verify that the system rejects an invalid verification code.
 *
 * GEEN MAILBOX-TOEGANG NODIG: we vullen gewoon een verzonnen, incorrecte
 * code in. Er is geen echte code nodig om dit gedrag te testen.
 *
 * Alle selectors hieronder zijn bevestigd via Codegen-opname op 14/07.
 */

test.describe('RT-REG-002 – Email Validation with an Invalid Code', () => {
  test('system rejects an invalid verification code', async ({ page }) => {
    const user = generateTestUser(); // levert bv. jan.de.wit+AI{n}@nbn.be op

    // Stap 1: Naar loginpagina, cookiebanner weg, naar registratie
    await page.goto('https://app-qa.nbn.be/data/r/platform/frontend/login');
    await page.getByRole('button', { name: 'Deny all' }).click();
    await page.getByRole('link', { name: 'Register here' }).click();

    // Stap 2: E-mailadres invullen
    await page.getByRole('textbox', { name: 'Email' }).fill(user.email);

    // Stap 3: Registratie/code aanvragen
    await page.getByRole('button', { name: 'Sign up' }).click();

    // Stap 4: Vul een verkeerde/verzonnen code in
    const wrongCode = '000000';
    await page.getByRole('textbox', { name: 'Verification code' }).fill(wrongCode);

    // Stap 5: Klik Verify
    await page.getByRole('button', { name: 'Verify' }).click();

    // --- Assertions (Expected Result) ---

    // De code wordt geweigerd + foutmelding
    // Substring-match i.p.v. exact, want volledige tekst nog niet 100%
    // bevestigd (bv. "Verification code is not valid." met/zonder punt).
    await expect(page.getByText('Verification code is not')).toBeVisible();

    // De gebruiker kan niet verder in het registratieproces
    // TODO: bevestig hoe dit te verifiëren is (bv. blijft op dezelfde pagina,
    // of een specifieke "Continue"-knop blijft disabled/afwezig)
  });
});
// paste dit in de terminal om de test te draaien: npx playwright test tests/RT-REG-002.spec.ts --project=chromium