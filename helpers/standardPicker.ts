import { Page } from '@playwright/test';

/**
 * Zoekt op een brede term (bv. "NBN EN 1090") en klikt automatisch op de
 * EERSTE nog koopbare taalversie die gevonden wordt (herkenbaar aan een
 * prijs in de link-tekst, bv. "French €160,00"), i.p.v. een specifieke
 * norm/taal hard te coderen.
 *
 * WAAROM: voor checkout-tests (CHK) is de exacte norm/taal irrelevant —
 * we testen de checkout-MECHANIEK (PO-nummer, betaalmethode, bevestiging),
 * niet een specifiek product. Elke succesvolle checkout verbruikt echter
 * permanent een taalversie (het is een echte bestelling), dus manueel
 * bijhouden welke normen/talen nog "vrij" zijn wordt snel omslachtig.
 *
 * Gebruik dit NIET voor CART-tests: daar willen we bewust een vaste,
 * voorspelbare norm (die nooit echt wordt afgerekend), zodat assertions
 * op een concrete titel/prijs kunnen blijven controleren.
 *
 * @returns de accessible name van de aangeklikte link (bv. "German €89,00"),
 *          zodat de test nadien kan verifiëren dat exact dát item in het
 *          mandje zit — zonder de norm vooraf te moeten kennen.
 */
export async function addFirstAvailableStandardToCart(
  page: Page,
  searchTerm: string,
  excludeText: string = 'NBN EN 1090-3' // gereserveerd voor de CART-tests (German), nooit aanraken
): Promise<string> {
  await page.goto('https://app-qa.nbn.be/data/r/platform/frontend/all-standards?lang=en');
  await page.locator('#P20_SEARCH').fill(searchTerm);
  await page.locator('#P20_SEARCH').press('Enter');
  await page.waitForLoadState('networkidle');

  // Koopbare taalversies zijn links met een prijs in de tekst (bv. "€160,00"),
  // in tegenstelling tot reeds-bezeten versies ("View in ...", geen prijs).
  // We sluiten expliciet de norm uit die gereserveerd is voor de CART-tests.
  const allPurchasableLinks = page.getByRole('link', { name: /€\s*\d+,\d+/ });
  const count = await allPurchasableLinks.count();

  for (let i = 0; i < count; i++) {
    const link = allPurchasableLinks.nth(i);
    const name = (await link.getAttribute('aria-label')) ?? (await link.innerText());

    // Check de omliggende context (rij) op de uitgesloten tekst, niet enkel
    // de link zelf, want "1090-3" staat op de titel van de rij, niet in de
    // taalversie-link-tekst zelf (bv. "German €89,00" bevat nooit "1090-3")
    const row = link.locator('xpath=ancestor::*[self::tr or self::li or self::div][1]');
    const rowText = await row.innerText().catch(() => '');

    if (!rowText.includes(excludeText)) {
      await link.click();
      return name;
    }
  }

  throw new Error(
    `Geen koopbare taalversie gevonden voor zoekterm "${searchTerm}" die niet "${excludeText}" bevat.`
  );
}