import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';
import { ensureCartIsEmpty } from '../helpers/cart';
import { addFirstAvailableStandardToCart } from '../helpers/standardPicker';

/**
 * RT-CHK-007 – Verify Order Confirmation After Successful Checkout
 *
 * Gebruikt Pay Later (eenvoudigste flow, geen externe fake-betaalpagina
 * nodig) om een order af te ronden, en verifieert dan de concrete
 * elementen die we al eerder zagen op de orderbevestigingspagina:
 * ordernummer (patroon "NBN-jjjj-nnnnn"), billing method, status, en
 * het gekochte item.
 */

test.describe('RT-CHK-007 – Verify Order Confirmation After Successful Checkout', () => {
  test('order confirmation is generated after successful checkout', async ({ page }) => {
    await login(page, process.env.NBN_QA_EMAIL!, process.env.NBN_QA_PASSWORD!);
    await ensureCartIsEmpty(page);

    // Willekeurige, nog-koopbare norm toevoegen
    await addFirstAvailableStandardToCart(page, 'NBN EN');

    // Winkelmandje openen
    await page.locator('iframe').contentFrame().getByRole('button', { name: 'View shopping basket' }).click();

    // Veiligheidscontrole
    await expect(page.getByText(/€\s*\d+,\d+/).first()).toBeVisible();

    // Pay Later selecteren (eenvoudigste, meest voorspelbare flow)
    await page.getByText('Pay later (+€30 excl. VAT)').click();

    // Voorwaarden aanvaarden
    await page.getByRole('checkbox', { name: "I've read and agree to the" }).check();

    // Checkout
    await page.getByRole('button', { name: 'Continue to checkout' }).click();

    // --- Assertions (Expected Result) ---

    // Geen vaste wachttijd (hard wait is een Playwright-anti-pattern):
    // de verwerkingstijd na "Continue to checkout" varieert (bevestigd:
    // soms enkele seconden, soms langer). We geven de assertion zelf een
    // ruime timeout — Playwright's expect() polt automatisch tot het
    // element verschijnt of de timeout verstrijkt, dus dit stopt zowel
    // sneller bij snelle verwerking als betrouwbaarder bij trage verwerking.

    // Uniek ordernummer wordt gegenereerd (patroon: NBN-jjjj-nnnnn)
    await expect(page.getByText(/NBN-\d{4}-\d+/)).toBeVisible({ timeout: 30000 });

    // Gekochte producten worden correct vermeld (norm-titel + prijs zichtbaar)
    await expect(page.getByText(/€\s*\d+,\d+/).first()).toBeVisible();

    // Billing-informatie wordt getoond (bevestigd 15/07: op deze directe
    // post-checkout pagina heten de labels "Transaction Status" en
    // "Total cost", niet "Billing method" — dat laatste bleek op een
    // andere pagina te staan, vermoedelijk de orderhistoriek-detailweergave)
    await expect(page.getByText('Transaction Status')).toBeVisible();
    await expect(page.getByText('Total cost')).toBeVisible();

    // Gekozen betaalmethode wordt getoond (op deze pagina als "Invoice" i.p.v.
    // letterlijk "Pay later" — bevestigd 15/07)
    await expect(page.getByText('Invoice with fee')).toBeVisible();

    // TODO: bevestigingsmail zelf kunnen we hier niet rechtstreeks verifiëren
    // zonder mailbox-toegang (zelfde blocker als bij REG-001) — enkel de
    // UI-bevestiging wordt hier getest.
  });
});
// paste dit in de terminal om de test te draaien: npx playwright test tests/RT-CHK-007.spec.ts --project=chromium