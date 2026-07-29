import { test, expect } from '@playwright/test';
import { dismissCookieBanner } from '../helpers/login';
import { generateTestUser } from '../helpers/testData';

/**
 * RT-REG-004 – Registration as a Private Individual
 *
 * Objective: Verify that a user can successfully register as a private individual.
 *
 * STATUS: SJABLOON — nog aan te vullen na Codegen-opname.
 * Volg de stappen hieronder in de VNC-sessie (npx playwright codegen <registratie-URL>)
 * en vervang elke TODO door de gegenereerde selector.
 *
 * TODO (vóór opname):
 *   - Registratiepagina-URL bevestigen (analoog aan login-URL-patroon?)
 *   - Bevestigen of "Private Individual" een radiobutton, dropdown-optie,
 *     of aparte knop/link is
 *   - Lijst van verplichte velden bevestigen (naam, adres, taal, etc.)
 *   - Bevestigen hoe "terms and conditions" precies wordt aangevinkt
 *     (checkbox-tekst/id)
 *   - Bevestigen wat het succes-resultaat concreet toont (bevestigingspagina?
 *     tekst? redirect naar login? bericht "check your email"?)
 */

test.describe('RT-REG-004 – Registration as a Private Individual', () => {
  test('a new user can register as a private individual', async ({ page }) => {
    const user = generateTestUser();

    // Stap 1: Open de registratiepagina
    // TODO: vervang door de bevestigde registratie-URL
    await page.goto('https://app-qa.nbn.be/data/r/platform/frontend/register'); // PLACEHOLDER
    await dismissCookieBanner(page);

    // Stap 2: Selecteer "Private Individual"
    // TODO: vervang door echte selector uit Codegen, bv.:
    // await page.getByRole('radio', { name: 'Private Individual' }).click();
    await page.locator('TODO_PRIVATE_INDIVIDUAL_SELECTOR').click();

    // Stap 3: Vul alle verplichte velden in met geldige gegevens
    // TODO: onderstaande zijn placeholders — pas veldnamen/selectors aan
    // na Codegen-opname. Denk aan: voornaam, achternaam, e-mail, wachtwoord,
    // taal, land, evt. telefoonnummer.
    await page.locator('TODO_EMAIL_FIELD_SELECTOR').fill(user.email);
    await page.locator('TODO_FIRSTNAME_FIELD_SELECTOR').fill(user.firstName);
    await page.locator('TODO_LASTNAME_FIELD_SELECTOR').fill(user.lastName);
    await page.locator('TODO_PASSWORD_FIELD_SELECTOR').fill(user.password);
    // ... eventueel meer verplichte velden hier toevoegen

    // Stap 4: Accepteer de algemene voorwaarden
    // TODO: vervang door echte selector, bv.:
    // await page.getByLabel('I accept the terms and conditions').check();
    await page.locator('TODO_TERMS_CHECKBOX_SELECTOR').check();

    // Stap 5: Klik op Register
    // TODO: bevestig exacte knoptekst (Engels/Nederlands? "Register"? "Sign up"?)
    await page.getByText('TODO_REGISTER_BUTTON_TEXT', { exact: true }).click();

    // --- Assertions (Expected Result) ---

    // 5a. Het account is succesvol aangemaakt
    // TODO: vervang door concrete check, bv. redirect-URL, bevestigingstekst,
    // of een "Registration successful" bericht op het scherm.
    await expect(page.getByText('TODO_SUCCESS_MESSAGE_TEXT')).toBeVisible();

    // 5b. Een bevestigingsmail is verzonden
    // NOTE: dit kunnen we hier niet rechtstreeks verifiëren zonder mailbox-
    // toegang (zie open vraag over IMAP/API-toegang voor RT-REG-001/002/003).
    // Voor nu: enkel het bevestigingsbericht op de pagina zelf controleren,
    // als de UI aangeeft dat de mail is verstuurd (bv. tekst "Check your inbox").

    // 5c. De gebruiker krijgt standaardrechten toegewezen aan privépersonen
    // TODO: bepalen of/hoe dit te verifiëren is via de UI na registratie
    // (bv. door in te loggen en een profielpagina te bekijken), of dat dit
    // buiten scope valt voor deze geautomatiseerde test.
  });
});
// paste dit in de terminal om de test te draaien: npx playwright test tests/RT-REG-004.spec.ts --project=chromium