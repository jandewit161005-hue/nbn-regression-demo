import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';
import * as fs from 'fs';

/**
 * RT-ORD-002 – Verify Invoice Availability Based on Payment Method
 *
 * Bevestigd via Codegen-opname op 15/07:
 * - Orderhistoriek bereikbaar via de "Order history"-tegel op de homepage:
 *   getByRole('link', { name: 'Order history View your order' })
 * - Elke order-rij heeft een directe "Invoice"-link (geen detailpagina nodig)
 *   die een download triggert bij klikken.
 *
 * Net als bij STD-004: we slaan het gedownloade bestand lokaal op en
 * verifiëren dat het een geldig, niet-leeg PDF-bestand is (magic bytes
 * "%PDF-"), niet enkel dat er "een download-event" plaatsvond.
 *
 * BEPERKING: we testen enkel de betaalmethodes die we effectief bezitten
 * via eerder afgeronde tests (Online Payment via CHK-001/003, Pay by
 * Invoice via CHK-004/007). Credit Line en Consolidated Invoicing kunnen
 * we niet testen — geen testaccount met kredietlijn (zelfde blocker als
 * CHK-005/006), dus die orders bestaan simpelweg niet in dit account.
 */

async function downloadAndVerifyInvoice(page: any, invoiceLink: any, label: string) {
  const downloadPromise = page.waitForEvent('download');
  await invoiceLink.click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBeTruthy();

  const savePath = `/tmp/${label}-${download.suggestedFilename()}`;
  await download.saveAs(savePath);

  const stats = fs.statSync(savePath);
  expect(stats.size).toBeGreaterThan(0);

  const fileHeader = fs.readFileSync(savePath, { encoding: 'utf-8', flag: 'r' }).slice(0, 5);
  expect(fileHeader).toBe('%PDF-');

  return savePath;
}

test.describe('RT-ORD-002 – Verify Invoice Availability Based on Payment Method', () => {
  test('Download Invoice is available for completed orders', async ({ page }) => {
    await login(page, process.env.NBN_QA_EMAIL!, process.env.NBN_QA_PASSWORD!);

    // Naar orderhistoriek navigeren via de homepage-tegel
    await page.getByRole('link', { name: 'Order history View your order' }).click();

    // --- Assertions (Expected Result) ---

    // Invoice-download werkt voor de eerste order in de lijst, en het
    // bestand is een geldig, niet-leeg PDF
    const path1 = await downloadAndVerifyInvoice(
      page,
      page.getByRole('link', { name: 'Invoice' }).first(),
      'order1'
    );
    console.log(`Factuur 1 opgeslagen op: ${path1}`);

    // Zelfde check voor een tweede order (bevestigt dat dit niet toevallig
    // enkel bij de eerste rij werkt)
    const path2 = await downloadAndVerifyInvoice(
      page,
      page.getByRole('link', { name: 'Invoice' }).nth(1),
      'order2'
    );
    console.log(`Factuur 2 opgeslagen op: ${path2}`);

    // TODO: Credit Line / Consolidated Invoicing niet testbaar — geen
    // testaccount met kredietlijn. Zie eerdere vraag aan Yvan (CHK-005/006).
  });
}); 
// paste dit in de terminal om de test te draaien: npx playwright test tests/RT-ORD-002.spec.ts --project=chromium