import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';
import { ensureCartIsEmpty } from '../helpers/cart';
 
/**
 * RT-CART-003 – Verify the Shopping Cart After Adding a Standard
 *
 * Bevestigd via Codegen-opname op 14/07.
 */
 
test.describe('RT-CART-003 – Verify Shopping Cart Contents', () => {
  test('added standard is correctly displayed in the cart', async ({ page }) => {
    await login(page, process.env.NBN_QA_EMAIL!, process.env.NBN_QA_PASSWORD!);
    await ensureCartIsEmpty(page);
 
    // Precondition: norm toevoegen aan het mandje (zelfde stappen als RT-CART-002)
    await page.goto('https://app-qa.nbn.be/data/r/platform/frontend/all-standards?lang=en');
    await page.locator('#P20_SEARCH').fill('NBN EN 1090');
    await page.locator('#P20_SEARCH').press('Enter');
    await page.waitForLoadState('networkidle');
    await page.getByRole('link', { name: 'NBN EN 1090-3:2019 ACTIVE' }).click();
    await page.getByRole('link', { name: 'German' }).click();
 
    // Stap 1: winkelmandje openen
    await page.locator('iframe').contentFrame().getByRole('button', { name: 'View shopping basket' }).click();
 
    // --- Assertions (Expected Result) ---
 
    // Toegevoegde norm wordt getoond (titel + taalversie)
    await expect(page.getByRole('link', { name: 'NBN EN 1090-3:2019 German' })).toBeVisible();
 
    // Correcte prijs
    await expect(page.getByText('€ 160,00').first()).toBeVisible();
 
    // Cart-totaal-label is aanwezig
    await expect(page.getByText('Total - VAT Exclusive')).toBeVisible();
    // TODO: bevestig het exacte totaalbedrag indien je meerdere items test
    // (bij 1 item zou totaal gelijk moeten zijn aan de prijs, € 160,00)
  });
});
// paste dit in de terminal om de test te draaien: npx playwright test tests/RT-CART-003.spec.ts --project=chromium