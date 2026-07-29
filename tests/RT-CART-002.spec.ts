import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';
import { ensureCartIsEmpty } from '../helpers/cart';
 
/**
 * RT-CART-002 – Search, Open Detail Page, and Add to Cart
 *
 * Bevestigd via Codegen-opname op 14/07:
 * - Zoekicoon header: getByRole('link', { name: 'Search icon' })
 * - Zoekveld: getByRole('textbox', { name: 'Search' })
 * - Zoekresultaat-link: getByRole('link', { name: 'NBN EN 1090-3:2019 ACTIVE' })
 * - "Add to Cart" = een taalversie kiezen op de detailpagina (bv. "German")
 * - Na taalkeuze verschijnt een iframe met "View shopping basket"-knop
 */
 
test.describe('RT-CART-002 – Search, Open Detail Page, and Add to Cart', () => {
  test('Portal User can open a standard detail page and add it to cart', async ({ page }) => {
    await login(page, process.env.NBN_QA_EMAIL!, process.env.NBN_QA_PASSWORD!);
    await ensureCartIsEmpty(page);
 
    // Stap 1-4: zoeken via de bevestigd betrouwbare catalogus-zoekpagina
    await page.goto('https://app-qa.nbn.be/data/r/platform/frontend/all-standards?lang=en');
    await page.locator('#P20_SEARCH').fill('NBN EN 1090');
    await page.locator('#P20_SEARCH').press('Enter');
    await page.waitForLoadState('networkidle');
 
    // Stap 5: zoekresultaat aanklikken → detailpagina openen
    await page.getByRole('link', { name: 'NBN EN 1090-3:2019 ACTIVE' }).click();
 
    // Stap 6-7: details staan op de pagina (status/datum, bevestigd project-context)
    await expect(page.getByText('ACTIVE').first()).toBeVisible();
 
    // Stap 8: Add to Cart = taalversie kiezen
    await page.getByRole('link', { name: 'German' }).click();
 
    // --- Assertions (Expected Result) ---
 
    // Bevestiging: "View shopping basket"-knop verschijnt in een iframe
    await expect(
      page.locator('iframe').contentFrame().getByRole('button', { name: 'View shopping basket' })
    ).toBeVisible();
 
    // Prijs zichtbaar
    await expect(page.getByText('€ 160,00').first()).toBeVisible();
  });
});
// paste dit in de terminal om de test te draaien: npx playwright test tests/RT-CART-002.spec.ts --project=chromium