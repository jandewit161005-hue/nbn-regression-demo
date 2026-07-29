import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';
import { ensureCartIsEmpty } from '../helpers/cart';

/**
 * RT-CHK-004 – Checkout Using Pay Later (Invoice)
 *
 * Bevestigd via Codegen-opname op 14/07:
 * - "View shopping basket"-knop zit in een iframe (zelfde als CART-tests)
 * - Betaalmethode: getByText('Pay later (+€30 excl. VAT)')
 * - Voorwaarden-checkbox: getByRole('checkbox', { name: "I've read and agree to the" })
 * - Checkout-knop: getByRole('button', { name: 'Continue to checkout' })
 * - Na checkout: redirect naar .../shop-redirect?... (met een sessie-specifieke
 *   token in de query-string, dus we matchen enkel het URL-patroon, niet de
 *   volledige URL)
 *
 * TODO: de opname stopt bij de redirect zelf — we weten nog niet wat er
 * precies op de resulterende orderbevestigingspagina te zien is (ordernummer,
 * tekst, "Invoice" als betaalmethode, enz.). Assertions hieronder zijn dus
 * nog een placeholder tot dat bevestigd is.
 */

test.describe('RT-CHK-004 – Checkout Using Pay Later (Invoice)', () => {
  test('Portal User can place an order using Pay Later / Invoice', async ({ page }) => {
    await login(page, process.env.NBN_QA_EMAIL!, process.env.NBN_QA_PASSWORD!);
    await ensureCartIsEmpty(page);

    // Product toevoegen aan het mandje (zelfde betrouwbare methode als CART-tests)
    await page.goto('https://app-qa.nbn.be/data/r/platform/frontend/all-standards?lang=en');
    await page.locator('#P20_SEARCH').fill('NBN EN 1090');
    await page.locator('#P20_SEARCH').press('Enter');
    await page.getByRole('link', { name: 'French €160,00' }).click();

    // Winkelmandje openen
    await page.locator('iframe').contentFrame().getByRole('button', { name: 'View shopping basket' }).click();

    // Stap 1-2: naar checkout (mandje is al open, "Continue to checkout" is de checkout-stap)

    // VEILIGHEIDSCONTROLE: bevestig dat het juiste item in het mandje zit
    // vóór we een echte, onomkeerbare bestelling plaatsen (bevestigd 14/07:
    // een eerder achtergebleven/vreemd item werd ooit per ongeluk afgerekend
    // i.p.v. het item dat deze test net toevoegde)
    await expect(page.getByText('NBN EN 1090-3:2019')).toBeVisible();

    // Stap 3: Pay Later selecteren
    await page.getByText('Pay later (+€30 excl. VAT)').click();

    // Stap 4: voorwaarden aanvaarden
    await page.getByRole('checkbox', { name: "I've read and agree to the" }).check();

    // Stap 5: bestelling plaatsen
    await page.getByRole('button', { name: 'Continue to checkout' }).click();

    // --- Assertions (Expected Result) ---

    // TODO: nog te bevestigen of Pay Later ook naar /shop-redirect gaat,
    // of gewoon op dezelfde pagina een bevestiging toont na verwerking.
    // Voorlopig: gewoon wachten tot het laden/verwerken klaar is.
    await page.waitForLoadState('load', { timeout: 30000 });
    await page.waitForTimeout(3000); // extra marge voor eventuele verwerkingstijd na het laden
  });
});
// paste dit in de terminal om de test te draaien: npx playwright test tests/RT-CHK-004.spec.ts --project=chromium