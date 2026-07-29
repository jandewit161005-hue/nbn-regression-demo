import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';
import { getFirstOwnedStandardTitle, clickOwnedLanguageVersion } from '../helpers/ownedStandard';

/**
 * RT-STD-003 – Open a Standard from the Standard Detail Page
 *
 * Generiek gemaakt, zelfde aanpak als STD-002, maar gaat eerst naar de
 * DETAILPAGINA vóór de "Open"-actie wordt aangeklikt (in de "Already
 * available in your standards collection"-sectie).
 */

test.describe('RT-STD-003 – Open a Standard from the Standard Detail Page', () => {
  test('Portal User can open a standard from the standard detail page', async ({ page }) => {
    await login(page, process.env.NBN_QA_EMAIL!, process.env.NBN_QA_PASSWORD!);

    const ownedTitle = await getFirstOwnedStandardTitle(page);

    await page.goto('https://app-qa.nbn.be/data/r/platform/frontend/all-standards?lang=en');
    await page.locator('#P20_SEARCH').fill(ownedTitle);
    await page.locator('#P20_SEARCH').press('Enter');
    await page.waitForLoadState('networkidle');

    // Detailpagina openen
    await page.getByText(ownedTitle).first().click();

    // Verifiëren dat de details correct getoond worden
    await expect(page).toHaveURL(/detail\?p40_id=/);
    await expect(page.getByRole('heading', { name: ownedTitle })).toBeVisible();

    // "Open"-actie: eender welke reeds-bezeten taalversie
    const usedLanguage = await clickOwnedLanguageVersion(page);

    // --- Assertions (Expected Result) ---

    const modalFrame = page.locator('iframe').contentFrame();
    await expect(modalFrame.getByRole('button', { name: 'Download' })).toBeVisible({ timeout: 15000 });
    await expect(modalFrame.getByText(ownedTitle).first()).toBeVisible();
  });
});
// paste dit in de terminal om de test te draaien: npx playwright test tests/RT-STD-003.spec.ts --project=chromium