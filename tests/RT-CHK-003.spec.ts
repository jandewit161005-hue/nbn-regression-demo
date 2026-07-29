import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';
import { ensureCartIsEmpty } from '../helpers/cart';
import { addFirstAvailableStandardToCart } from '../helpers/standardPicker';

/**
 * RT-CHK-003 – Checkout Using Online Payment
 *
 * Bevestigde flow (zelfde mechaniek als CHK-001/002): checkout leidt naar
 * een fake betaalplatform met providerkeuze (bv. "Bancontact"), gevolgd
 * door een "Paid"-simulatie en "Continue ›".
 */

test.describe('RT-CHK-003 – Checkout Using Online Payment', () => {
  test('Portal User can complete a purchase using online payment', async ({ page }) => {
    await login(page, process.env.NBN_QA_EMAIL!, process.env.NBN_QA_PASSWORD!);
    await ensureCartIsEmpty(page);

    // Willekeurige, nog-koopbare norm toevoegen
    const addedItem = await addFirstAvailableStandardToCart(page, 'NBN EN');

    // Winkelmandje openen
    await page.locator('iframe').contentFrame().getByRole('button', { name: 'View shopping basket' }).click();

    // Veiligheidscontrole
    await expect(page.getByText(/€\d+,\d+/).first()).toBeVisible();

    // Voorwaarden aanvaarden
    await page.getByRole('checkbox', { name: "I've read and agree to the" }).check();

    // Checkout
    await page.getByRole('button', { name: 'Continue to checkout' }).click();

    // Online betaling: fake betaalplatform, provider kiezen en betaling simuleren
    await page.getByRole('button', { name: 'Bancontact' }).click();
    await page.getByRole('radio', { name: 'Paid' }).check();
    await page.getByRole('button', { name: 'Continue ›' }).click();

    // --- Assertions (Expected Result) ---
    await page.waitForLoadState('load', { timeout: 30000 });

    // TODO: bevestigen dat de orderstatus correct wordt bijgewerkt na
    // succesvolle online betaling (bv. status "Paid" i.p.v. "Payment open"
    // zoals we eerder zagen bij Pay Later/Invoice)
    // await expect(page.getByText('Paid')).toBeVisible();

    // TODO: bevestigen dat de gekochte norm effectief beschikbaar is
    // (bv. via "My collection" of directe toegang tot het document)
  });
});
// paste dit in de terminal om de test te draaien: npx playwright test tests/RT-CHK-003.spec.ts --project=chromium