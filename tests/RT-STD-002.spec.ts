import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';
import { getFirstOwnedStandardTitle, clickOwnedLanguageVersion } from '../helpers/ownedStandard';

/**
 * RT-STD-002 – Open Standard Directly from the Search Results
 *
 * Generiek gemaakt: gebruikt de eerste norm die het account toevallig
 * bezit (via My Standards), i.p.v. een hardgecodeerde norm+taal. Werkt
 * dus ongeacht welk testaccount gebruikt wordt.
 *
 * Bevestigd patroon: een reeds-bezeten taalversie-link (exact "French"/
 * "English"/"German", zonder prijs) is de "Open (eye)"-actie: dit opent
 * een PDF-viewer-modal binnen een iframe op dezelfde pagina.
 */

test.describe('RT-STD-002 – Open Standard Directly from the Search Results', () => {
  test('Portal User can open a standard directly from search results', async ({ page }) => {
    await login(page, process.env.NBN_QA_EMAIL!, process.env.NBN_QA_PASSWORD!);

    // Titel van een eigen norm ophalen (generiek, geen hardcoded norm)
    const ownedTitle = await getFirstOwnedStandardTitle(page);

    // Diezelfde norm opzoeken via de catalogus-zoekpagina
    await page.goto('https://app-qa.nbn.be/data/r/platform/frontend/all-standards?lang=en');
    await page.locator('#P20_SEARCH').fill(ownedTitle);
    await page.locator('#P20_SEARCH').press('Enter');
    await page.waitForLoadState('networkidle');

    // Bevestig dat de verwachte norm in de resultaten verschijnt
    await expect(page.getByText(ownedTitle).first()).toBeVisible();

    // Klik de "Open (eye)"-actie: eender welke reeds-bezeten taalversie
    const usedLanguage = await clickOwnedLanguageVersion(page);

    // --- Assertions (Expected Result) ---

    // De norm opent succesvol: de PDF-viewer-modal verschijnt (iframe)
    const modalFrame = page.locator('iframe').contentFrame();
    await expect(modalFrame.getByRole('button', { name: 'Download' })).toBeVisible({ timeout: 15000 });

    // De juiste norm-inhoud wordt getoond (titel in de modal zelf)
    await expect(modalFrame.getByText(ownedTitle).first()).toBeVisible();
  });
});
// paste dit in de terminal om de test te draaien: npx playwright test tests/RT-STD-002.spec.ts --project=chromium