import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';
import { ensureCartIsEmpty } from '../helpers/cart';
import { addFirstAvailableStandardToCart } from '../helpers/standardPicker';

/**
 * RT-CHK-001 – Checkout Without a PO Number
 *
 * Bijgewerkt om consistent te zijn met CHK-002/003/007: gebruikt nu de
 * addFirstAvailableStandardToCart-helper i.p.v. een hardgecodeerde norm
 * (NBN EN 1090-4 + French). Dit was oorspronkelijk hardgecodeerd omdat
 * deze test gebouwd werd vóór de standardPicker-helper bestond — puur
 * chronologisch, geen bewuste keuze. Nu rechtgetrokken.
 *
 * Betaalmethode: online betaling via het fake betaalplatform (kies een
 * provider zoals "Bancontact", dan "Paid"-radioknop, dan "Continue ›").
 * PO-nummerveld wordt bewust niet aangeraakt (kern van deze test).
 */

test.describe('RT-CHK-001 – Checkout Without a PO Number', () => {
  test('Portal User can complete checkout without a PO number', async ({ page }) => {
    await login(page, process.env.NBN_QA_EMAIL!, process.env.NBN_QA_PASSWORD!);
    await ensureCartIsEmpty(page);

    // Willekeurige, nog-koopbare norm toevoegen (irrelevant welke precies)
    const addedItem = await addFirstAvailableStandardToCart(page, 'NBN EN');

    // Winkelmandje openen
    await page.locator('iframe').contentFrame().getByRole('button', { name: 'View shopping basket' }).click();

    // VEILIGHEIDSCONTROLE: bevestig dat er iets koopbaars in het mandje zit
    await expect(page.getByText(/€\s*\d+,\d+/).first()).toBeVisible();

    // Betaalmethode: Pay now (online betaling) — expliciet gekozen voor
    // duidelijkheid, ook al leek dit soms al standaard geselecteerd
    const payNowOption = page.getByText('Pay now', { exact: false });
    if (await payNowOption.isVisible().catch(() => false)) {
      await payNowOption.click();
    }

    // PO-nummer: bewust NIET invullen (dit is de kern van deze test)

    // Voorwaarden aanvaarden
    await page.getByRole('checkbox', { name: "I've read and agree to the" }).check();

    // Checkout
    await page.getByRole('button', { name: 'Continue to checkout' }).click();

    // Fake betaalplatform: provider kiezen en betaling simuleren
    await page.getByRole('button', { name: 'Bancontact' }).click();
    await page.getByRole('radio', { name: 'Paid' }).check();
    await page.getByRole('button', { name: 'Continue ›' }).click();

    // --- Assertions (Expected Result) ---

    await page.getByRole('button', { name: 'View my order history' }).click();

    // Ordernummer verschijnt (bevestigt succesvolle checkout, zelfde patroon als CHK-007)
    // .first() nodig: we landen op de orderhistoriek, die ALLE eerdere
    // orders toont, niet enkel de zonet geplaatste
    await expect(page.getByText(/NBN-\d{4}-\d+/).first()).toBeVisible({ timeout: 30000 });
  });
});
// paste dit in de terminal om de test te draaien: npx playwright test tests/RT-CHK-001.spec.ts --project=chromium