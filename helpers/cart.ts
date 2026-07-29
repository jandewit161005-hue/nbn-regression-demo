import { Page } from '@playwright/test';

/**
 * Zorgt dat het winkelmandje leeg is vóór een CART-test start, ongeacht
 * wat een vorige testrun heeft achtergelaten. Zonder dit raken tests
 * afhankelijk van elkaars staat: een item dat al "aangevinkt"/in het
 * mandje zit toont andere knoppen/namen dan een vers item, wat selectors
 * doet falen (zie RT-CART-001 timeout op 14/07).
 *
 * Gebruik: roep dit meteen na login() aan, vóór je begint te zoeken.
 */
export async function ensureCartIsEmpty(page: Page) {
  // Open het winkelmandje via het icoon in de header
  await page.getByRole('link', { name: 'Shopping bag icon' }).click();
  // Wachten op concreet signaal i.p.v. trage/onbetrouwbare networkidle
  await page.getByText('Shopping basket').first().waitFor({ state: 'visible', timeout: 15000 });

  // Blijf items verwijderen zolang er nog een "Remove"-link te vinden is
  // (voor het geval er ooit meer dan 1 item in zou staan)
  let removeLink = page.getByRole('link', { name: 'Remove' });
  while (await removeLink.isVisible().catch(() => false)) {
    await removeLink.click();

    // Bevestigingsdialoog: kan ofwel rechtstreeks op de pagina staan
    // ("Are you sure?"-modal) ofwel in een iframe. De modal heeft een korte
    // renderverstraging, dus we gebruiken waitFor() (met timeout) i.p.v. een
    // instant isVisible()-check, die de modal soms mist als hij nog niet
    // volledig verschenen is (bevestigd 14/07: instant check faalde silent).
    const confirmButtonOnPage = page.getByRole('button', { name: 'Remove' });
    const confirmButtonInIframe = page.locator('iframe').contentFrame().getByRole('button', { name: 'Remove' });

    const onPageAppeared = await confirmButtonOnPage
      .waitFor({ state: 'visible', timeout: 3000 })
      .then(() => true)
      .catch(() => false);

    if (onPageAppeared) {
      await confirmButtonOnPage.click();
    } else {
      const inIframeAppeared = await confirmButtonInIframe
        .waitFor({ state: 'visible', timeout: 3000 })
        .then(() => true)
        .catch(() => false);
      if (inIframeAppeared) {
        await confirmButtonInIframe.click();
      }
    }

    await page.waitForLoadState('networkidle');
    removeLink = page.getByRole('link', { name: 'Remove' });
  }
}