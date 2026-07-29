import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';

/**
 * RT-STD-001 – Open a Standard from the "My Standards" Home Screen Widget
 *
 * Bevestigd via Codegen-opname op 15/07:
 * - Eigen/aangekochte normen tonen een link met status "PUBLISHED"
 *   (i.p.v. "ACTIVE" zoals op de catalogus-zoekpagina)
 * - Klikken leidt naar het bekende detailpagina-patroon:
 *   .../detail?p40_id=...&session=...
 *
 * We kiezen bewust de EERSTE beschikbare eigen norm i.p.v. een specifieke
 * te hardcoden — welke norm het precies is, is irrelevant voor wat deze
 * test moet bewijzen (navigatie-mechaniek, niet productinhoud).
 */

test.describe('RT-STD-001 – Open a Standard from My Standards Widget', () => {
  test('Portal User can open a standard from the home screen widget', async ({ page }) => {
    await login(page, process.env.NBN_QA_EMAIL!, process.env.NBN_QA_PASSWORD!);

    // We landen na login al op de homepage (bevestigd via login-helper)
    const ownedStandardLink = page.getByRole('link', { name: /PUBLISHED/ }).first();
    await ownedStandardLink.waitFor({ state: 'visible', timeout: 15000 });

    // Onthoud de tekst vóór het klikken, voor een latere titel-check
    const linkText = await ownedStandardLink.innerText();

    await ownedStandardLink.click();

    // --- Assertions (Expected Result) ---

    // De norm opent succesvol (bekend detailpagina-URL-patroon)
    await expect(page).toHaveURL(/detail\?p40_id=/);

    // De juiste norm-titel komt overeen (linkText was bv. "NBN EN 1090-4:2018 PUBLISHED",
    // we strippen het statuslabel eraf en checken of de kern-titel op de
    // detailpagina terugkomt — bevestigd 15/07 dat titel+status samen de
    // link-naam vormen, en dat de detailpagina dezelfde titel als heading toont)
    const standardTitle = linkText.replace(/\s*PUBLISHED\s*$/, '').trim();
    await expect(page.getByRole('heading', { name: standardTitle })).toBeVisible();
  });
});
// paste dit in de terminal om de test te draaien: npx playwright test tests/RT-STD-001.spec.ts --project=chromium