import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';
import { clickOwnedLanguageVersion } from '../helpers/ownedStandard';
import * as fs from 'fs';

/**
 * RT-STD-004 – Download a Standard from the PDF Reader
 *
 * Generiek gemaakt: gebruikt My Standards (zelfde als STD-001) + eender
 * welke reeds-bezeten taalversie i.p.v. hardgecodeerd "French".
 */

test.describe('RT-STD-004 – Download a Standard from the PDF Reader', () => {
  test('Portal User can download a standard from the PDF reader', async ({ page }) => {
    await login(page, process.env.NBN_QA_EMAIL!, process.env.NBN_QA_PASSWORD!);

    // Norm openen vanuit My Standards (generieke aanpak, zelfde als STD-001)
    const ownedStandardLink = page.getByRole('link', { name: /PUBLISHED/ }).first();
    await ownedStandardLink.waitFor({ state: 'visible', timeout: 15000 });
    await ownedStandardLink.click();

    // We landen op de detailpagina; open de PDF-viewer via eender welke
    // reeds-bezeten taalversie
    const usedLanguage = await clickOwnedLanguageVersion(page);

    // Wachten tot de PDF-lezer geladen is (iframe-modal)
    const modalFrame = page.locator('iframe').contentFrame();
    await expect(modalFrame.getByRole('button', { name: 'Download' })).toBeVisible({ timeout: 15000 });

    // Download starten en afwachten
    const downloadPromise = page.waitForEvent('download');
    await modalFrame.getByRole('button', { name: 'Download' }).click();
    const download = await downloadPromise;

    // --- Assertions (Expected Result) ---

    expect(download.suggestedFilename()).toBeTruthy();

    const savePath = `/tmp/${download.suggestedFilename()}`;
    await download.saveAs(savePath);
    const stats = fs.statSync(savePath);
    expect(stats.size).toBeGreaterThan(0);

    const fileHeader = fs.readFileSync(savePath, { encoding: 'utf-8', flag: 'r' }).slice(0, 5);
    expect(fileHeader).toBe('%PDF-');
  });
});
// paste dit in de terminal om de test te draaien: npx playwright test tests/RT-STD-004.spec.ts --project=chromium