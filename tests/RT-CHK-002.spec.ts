import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';
import { ensureCartIsEmpty } from '../helpers/cart';
import { addFirstAvailableStandardToCart } from '../helpers/standardPicker';

/**
 * RT-CHK-002 – Checkout With a PO Number
 *
 * Hergebruikt de bevestigde checkout-flow uit CHK-001/CHK-004, met als
 * enige verschil: een geldig PO-nummer invullen vóór het afronden.
 *
 * TODO: exacte selector voor het PO-nummerveld nog te bevestigen (gok op
 * basis van het zichtbare label "Add a PO number" uit eerdere screenshots).
 */

test.describe('RT-CHK-002 – Checkout With a PO Number', () => {
  test('Portal User can complete checkout with a PO number', async ({ page }) => {
    await login(page, process.env.NBN_QA_EMAIL!, process.env.NBN_QA_PASSWORD!);
    await ensureCartIsEmpty(page);

    // Willekeurige, nog-koopbare norm toevoegen (irrelevant welke precies)
    await addFirstAvailableStandardToCart(page, 'NBN EN');

    // Winkelmandje openen
    await page.locator('iframe').contentFrame().getByRole('button', { name: 'View shopping basket' }).click();

    // Veiligheidscontrole: er staat iets koopbaars in het mandje
    await expect(page.getByText(/€\d+,\d+/).first()).toBeVisible();

    // PO-nummer invullen (kern van deze test)
    // TODO: bevestig deze selector, mogelijks getByPlaceholder of andere naam
    await page.getByRole('textbox', { name: 'Add a PO number' }).fill('PO-TEST-12345');

    // Voorwaarden aanvaarden
    await page.getByRole('checkbox', { name: "I've read and agree to the" }).check();

    // Checkout
    await page.getByRole('button', { name: 'Continue to checkout' }).click();

    // Fake betaalplatform
    await page.getByRole('button', { name: 'Bancontact' }).click();
    await page.getByRole('radio', { name: 'Paid' }).check();
    await page.getByRole('button', { name: 'Continue ›' }).click();

    // --- Assertions (Expected Result) ---
    await page.waitForLoadState('load', { timeout: 30000 });

    // TODO: bevestigen dat het PO-nummer zichtbaar is in de orderdetails
    // await expect(page.getByText('PO-TEST-12345')).toBeVisible();
  });
});
// paste dit in de terminal om de test te draaien: npx playwright test tests/RT-CHK-002.spec.ts --project=chromium