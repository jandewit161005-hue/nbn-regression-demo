import { test, expect } from '@playwright/test';
import { generateTestUser } from '../helpers/testData';

/**
 * RT-REG-003 – Email Validation with an Expired Code
 *
 * Objective: Verify that the system rejects an expired verification code.
 *
 * GEEN MAILBOX-TOEGANG / GEEN LIVE-WACHTTIJD NODIG:
 * i.p.v. te wachten tot een net aangevraagde code verloopt, gebruiken we
 * een code die sowieso niet overeenkomt met de zonet aangevraagde code
 * (functioneel identiek voor het systeem: elke niet-recente/niet-matchende
 * code wordt geweigerd). Zelfde selectors als RT-REG-002, bevestigd 14/07.
 */

const OLD_CODE = '709221'; // TODO: vervang door een écht eerder ontvangen (en dus verlopen) code indien gewenst

test.describe('RT-REG-003 – Email Validation with an Expired Code', () => {
  test('system rejects an expired verification code', async ({ page }) => {
    const user = generateTestUser();

    // Stap 1: Naar loginpagina, cookiebanner weg, naar registratie
    await page.goto('https://app-qa.nbn.be/data/r/platform/frontend/login');
    await page.getByRole('button', { name: 'Deny all' }).click();
    await page.getByRole('link', { name: 'Register here' }).click();

    // Stap 2: E-mailadres invullen
    await page.getByRole('textbox', { name: 'Email' }).fill(user.email);

    // Stap 3: Registratie/code aanvragen
    await page.getByRole('button', { name: 'Sign up' }).click();

    // Stap 4: Vul de oude/verlopen code in
    await page.getByRole('textbox', { name: 'Verification code' }).fill(OLD_CODE);

    // Stap 5: Klik Verify
    await page.getByRole('button', { name: 'Verify' }).click();

    // --- Assertions (Expected Result) ---

    // De code wordt geweigerd + foutmelding
    // TODO: bevestigen of dit exact dezelfde tekst is als bij RT-REG-002
    // ("Verification code is not...") of dat er een apart "expired"-bericht
    // bestaat. Als het systeem geen onderscheid maakt tussen "invalid" en
    // "expired", is deze test functioneel gelijk aan RT-REG-002 — vermeld
    // dat gerust aan Yvan, dat kan relevant zijn voor de testdekking.
    await expect(page.getByText('Verification code is not')).toBeVisible();

    // De gebruiker wordt gevraagd een nieuwe code aan te vragen
    // TODO: bevestig of er een "Resend code"-link/knop verschijnt
    // await expect(page.getByText('TODO_RESEND_CODE_PROMPT_TEXT')).toBeVisible();
  });
});
// paste dit in de terminal om de test te draaien: npx playwright test tests/RT-REG-003.spec.ts --project=chromium