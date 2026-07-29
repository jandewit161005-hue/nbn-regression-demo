import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';
import { ensureCartIsEmpty } from '../helpers/cart';
 
/**
 * RT-CART-004 – Remove a Standard from the Shopping Cart
 *
 * Bevestigd via Codegen-opname op 14/07.
 */
 
test.describe('RT-CART-004 – Remove Standard from Shopping Cart', () => {
  test('Portal User can remove a standard from the cart', async ({ page }) => {
    await login(page, process.env.NBN_QA_EMAIL!, process.env.NBN_QA_PASSWORD!);
    await ensureCartIsEmpty(page);
 
    // Precondition: norm toevoegen aan het mandje
    await page.goto('https://app-qa.nbn.be/data/r/platform/frontend/all-standards?lang=en');
    await page.locator('#P20_SEARCH').fill('NBN EN 1090');
    await page.locator('#P20_SEARCH').press('Enter');
    await page.waitForLoadState('networkidle');
    await page.getByRole('link', { name: 'NBN EN 1090-3:2019 ACTIVE' }).click();
    await page.getByRole('link', { name: 'German' }).click();
 
    // Stap 1: winkelmandje openen
    await page.locator('iframe').contentFrame().getByRole('button', { name: 'View shopping basket' }).click();
 
    // Stap 2: norm staat in het mandje
    await expect(page.getByRole('link', { name: 'NBN EN 1090-3:2019 German' })).toBeVisible();
 
    // Stap 3: Remove klikken
    await page.getByRole('link', { name: 'Remove' }).click();
 
    // Stap 4: bevestigingsdialoog (in iframe)
    await page.locator('iframe').contentFrame().getByRole('button', { name: 'Remove' }).click();
 
    // --- Assertions (Expected Result) ---
 
    // Norm is niet langer zichtbaar in het mandje
    await expect(page.getByRole('link', { name: 'NBN EN 1090-3:2019 German' })).not.toBeVisible();
 
    // "Continue shopping" bevestigt een leeg/bijgewerkt mandje
    await expect(page.getByRole('button', { name: 'Continue shopping' })).toBeVisible();
  });
});
// paste dit in de terminal om de test te draaien: npx playwright test tests/RT-CART-004.spec.ts --project=chromium