import { test, expect } from '@playwright/test';
import { dismissCookieBanner } from '../helpers/login';

/**
 * RT-PWD-003 – Password Reset with Invalid Verification Code
 * Priority: High
 *
 * Selectors bevestigd via codegen-opname (Deel A + B):
 * - Reset-flow: link "Forgot password?" → veld "Username" → knop "Submit"
 * - Codescherm: titel "Verification code" (h1#R_RESET_heading),
 *   invoerveld "Verification code" (#P10003_VERIFICATION_CODE),
 *   knop "Verify" (niet "Validate")
 *
 * BELANGRIJKE VONDST (bevestigd via Deel B-opname, 2x getest):
 * De site toont géén aparte "invalid code"-foutmelding zolang je binnen
 * een oplopende throttle/cooldown-periode blijft klikken op Verify
 * ("Please try again in 4 seconds." → na een volgende poging "...in 14
 * seconds.", lijkt op te lopen per poging). We hebben nog niet kunnen
 * bevestigen of er ÜBERHAUPT een aparte "invalid code"-tekst bestaat na
 * het uitzitten van de cooldown — dat vraagt een aparte, trage test.
 * Daarom mikt de assertion hieronder bewust breed: "een foutmelding
 * verschijnt EN je blijft op het codescherm", i.p.v. specifiek op
 * "invalid code" te matchen (dat zou nu een false negative geven).
 *
 * TODO: als later blijkt dat er wél een aparte "invalid code"-melding
 * bestaat (na voldoende wachttijd ná de laatste poging), deze test
 * splitsen in twee gevallen: throttle-respons vs. echte content-validatie.
 *
 * Geen human-input nodig: we vullen bewust een code in die met (vrijwel)
 * zekerheid nooit geldig is, dus we hoeven niet te wachten op een echte
 * e-mail.
 */

test.describe('RT-PWD-003 – Password Reset with Invalid Verification Code', () => {
  test('an incorrect verification code is rejected', async ({ page }) => {
    await page.goto('https://app-qa.nbn.be/data/r/platform/frontend/login');
    await dismissCookieBanner(page);

    // Stap 1: reset aanvragen
    await page.getByRole('link', { name: 'Forgot password?' }).click();
    await page.getByRole('textbox', { name: 'Username' }).fill(process.env.NBN_QA_EMAIL!);
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByRole('heading', { name: 'Verification code' })).toBeVisible({ timeout: 15000 });

    // Stap 2: bewust foutieve code invullen
    // "000000" is een placeholder; pas aan indien de site een ander format
    // afdwingt (bv. 6 alfanumerieke tekens)
    await page.getByRole('textbox', { name: 'Verification code' }).fill('000000');

    // Stap 3: valideren
    await page.getByRole('button', { name: 'Verify' }).click();

    // --- Assertions (Expected Result) ---

    // Er verschijnt een foutmelding/blokkering (throttle-tekst "Please try
    // again in X seconds." óf, indien ooit bevestigd, een echte
    // "invalid code"-tekst)
    await expect(page.getByText(/please try again in \d+ seconds|invalid.*code|code.*invalid/i)).toBeVisible();

    // Gebruiker kan niet verder in het reset-proces: we blijven op het
    // codescherm (geen doorverwijzing naar "nieuw wachtwoord instellen")
    await expect(page.getByRole('textbox', { name: /new password/i })).not.toBeVisible();
  });
});
// paste dit in de terminal om de test te draaien: npx playwright test tests/RT-PWD-003.spec.ts --project=chromium