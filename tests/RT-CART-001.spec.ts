import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';
import { ensureCartIsEmpty } from '../helpers/cart';

/**
 * RT-CART-001 – Search for a Standard and Add It to the Shopping Cart
 * from the Search Results
 *
 * Bevestigd via Codegen-opname op 14/07: de zoekresultatenlijst toont
 * een directe link met taalversie + prijs (bv. "German €160,00"),
 * die je zonder de detailpagina te openen kan aanklikken om toe te voegen
 * aan het winkelmandje. Dit is dus een écht apart pad t.o.v. RT-CART-002
 * (waar je eerst de detailpagina opent).
 */

test.describe('RT-CART-001 – Search and Add to Cart from Search Results', () => {
  test('Portal User can search for a standard and add it to cart from results', async ({ page }) => {
    await login(page, process.env.NBN_QA_EMAIL!, process.env.NBN_QA_PASSWORD!);
    await ensureCartIsEmpty(page);

    // Stap 1-4: zoeken via de bevestigd betrouwbare catalogus-zoekpagina
    // (het zoekicoon in de header bleek onbetrouwbaar/leeg resultaat te geven —
    // zie projectnotities: #search-2 op de homepage is niet bruikbaar,
    // #P20_SEARCH op /all-standards is de bevestigd werkende methode)
    await page.goto('https://app-qa.nbn.be/data/r/platform/frontend/all-standards?lang=en');
    await page.locator('#P20_SEARCH').fill('NBN EN 1090');
    await page.locator('#P20_SEARCH').press('Enter');
    await page.waitForLoadState('networkidle');

    // Stap 5: verifiëren dat de verwachte norm in de resultaten verschijnt
    await expect(page.getByText('NBN EN 1090-3:2019')).toBeVisible();

    // Stap 6: rechtstreeks vanuit de resultatenlijst toevoegen aan cart
    // (taalversie + prijs-link, zonder detailpagina te openen)
    await page.getByRole('link', { name: 'German €160,00' }).click();

    // --- Assertions (Expected Result) ---

    // Bevestiging: "View shopping basket"-knop verschijnt in een iframe
    await expect(
      page.locator('iframe').contentFrame().getByRole('button', { name: 'View shopping basket' })
    ).toBeVisible();

    // De norm verschijnt in het winkelmandje
    await page.locator('iframe').contentFrame().getByRole('button', { name: 'View shopping basket' }).click();
    await expect(page.getByRole('link', { name: 'NBN EN 1090-3:2019 German' })).toBeVisible();
    await expect(page.getByText('€ 160,00').first()).toBeVisible();
  });
});
// paste dit in de terminal om de test te draaien: npx playwright test tests/RT-CART-001.spec.ts --project=chromium