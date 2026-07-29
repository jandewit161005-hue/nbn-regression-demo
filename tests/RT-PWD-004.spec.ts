import { test, expect } from '@playwright/test';
import { dismissCookieBanner } from '../helpers/login';

/**
 * RT-PWD-004 – Password Reset with Expired Verification Code
 *
 * LET OP:
 * - De geldigheidsduur van de code (EXPECTED_CODE_LIFETIME_MS hieronder)
 *   is een PLACEHOLDER (10 min). Dit moet je bevestigen (functioneel
 *   document, backend-config, of gewoon 1x manueel timen) vóór deze test
 *   betrouwbaar is. Zet 'm te laag en de test faalt fout-positief (code
 *   nog geldig); te hoog en de test duurt nodeloos lang.
 * - We wachten hier de VOLLEDIGE levensduur uit met een echte klok-wait.
 *   Dit is bewust de uitzondering op de regel "vermijd hard waits":
 *   er is geen ander signaal waarop we kunnen wachten om "verlopen" te
 *   forceren. Zet deze test in een apart, traag/nightly-project i.p.v.
 *   in de gewone regressierun (test.slow() hieronder verhoogt alvast
 *   Playwright's eigen timeout, maar CI-jobtimeouts moet je apart nakijken).
 * - Vult, net als PWD-003, een willekeurige/foutieve code in ná het
 *   verlopen — als je liever de ECHTE (nu-verlopen) code test, is
 *   emailVerification.ts (Graph API) nodig om die code op te halen,
 *   wat nog niet beschikbaar is (IT-aanvraag lopend).
 */

const EXPECTED_CODE_LIFETIME_MS = 10 * 60 * 1000; // TODO: bevestig echte waarde

test.describe('RT-PWD-004 – Password Reset with Expired Verification Code', () => {
  test('an expired verification code is rejected', async ({ page }) => {
    test.slow(); // deze test duurt lang door de bewuste wachttijd hierboven
    test.setTimeout(EXPECTED_CODE_LIFETIME_MS + 60_000);

    await page.goto('https://app-qa.nbn.be/data/r/platform/frontend/login');
    await dismissCookieBanner(page);

    // Stap 1: reset aanvragen (selectors bevestigd via codegen, Deel A)
    await page.getByRole('link', { name: 'Forgot password?' }).click();
    await page.getByRole('textbox', { name: 'Username' }).fill(process.env.NBN_QA_EMAIL!);
    await page.getByRole('button', { name: 'Submit' }).click();

    // Wacht op het codescherm vóór we de klok laten lopen
    // (heading-rol i.p.v. getByText — zie toelichting/fix in PWD-001)
    await expect(page.getByRole('heading', { name: 'Verification code' })).toBeVisible({ timeout: 15000 });

    // Stap 2: wachten tot de code verlopen is
    await page.waitForTimeout(EXPECTED_CODE_LIFETIME_MS);

    // Stap 3: (nu verlopen) code invullen
    // TODO: zonder emailVerification.ts kennen we de echte code niet; we
    // vullen hier een plausibel-formaat placeholder in. Zodra de Graph
    // API-helper beschikbaar is, vervang dit door de echt opgehaalde code
    // zodat we specifiek "verlopen" testen i.p.v. "willekeurig fout".
    await page.getByRole('textbox', { name: 'Verification code' }).fill('123456');

    // Stap 4: valideren
    await page.getByRole('button', { name: 'Verify' }).click();

    // --- Assertions (Expected Result) ---

    // Foutmelding wordt getoond (throttle-tekst "Please try again in X
    // seconds." bevestigd als het gedrag bij een foutieve/afgewezen code —
    // zie uitgebreide toelichting in PWD-003. Of "expired" indien de site
    // die specifieke tekst toch los toont na de echte levensduur.)
    await expect(page.getByText(/please try again in \d+ seconds|expired|invalid.*code|code.*invalid/i)).toBeVisible();

    // TODO: het scherm toont geen zichtbare "resend/nieuwe code"-knop op de
    // screenshot die we tot nu toe hebben (enkel "Verification code not
    // received? Contact NBN: ..."). Check tijdens Deel B of er ná een
    // afgewezen/verlopen code alsnog een resend-optie verschijnt, en vervang
    // onderstaande assertion door wat je effectief ziet.
    // await expect(page.getByRole(/* ... */)).toBeVisible();

    // Gebruiker kan niet verder tot een geldige code is ingevuld
    await expect(page.getByRole('textbox', { name: /new password/i })).not.toBeVisible();
  });
});
//deze werkt niet