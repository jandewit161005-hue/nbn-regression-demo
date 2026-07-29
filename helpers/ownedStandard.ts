import { Page } from '@playwright/test';

/**
 * Haalt de titel op van de EERSTE norm die het account al bezit, via de
 * "My Standards"-widget op de homepage (zelfde generieke aanpak als
 * RT-STD-001). Nuttig om vervolgens diezelfde norm op te zoeken via de
 * catalogus-zoekpagina, zonder een specifieke norm te hardcoden.
 */
export async function getFirstOwnedStandardTitle(page: Page): Promise<string> {
  await page.goto('https://app-qa.nbn.be/data/r/platform/frontend/home');

  const ownedStandardLink = page.getByRole('link', { name: /PUBLISHED/ }).first();
  await ownedStandardLink.waitFor({ state: 'visible', timeout: 15000 });

  const linkText = await ownedStandardLink.innerText();
  return linkText.replace(/\s*PUBLISHED\s*$/, '').trim();
}

/**
 * Klikt op de eerste beschikbare, reeds-bezeten taalversie-link (French,
 * English of German). Robuuster dan pure naam-matching: sommige pagina's
 * tonen ook koop-knoppen zonder prijs in de naam (bevestigd 16/07 — een
 * "German"-koopknop werd ooit per ongeluk aangeklikt, want naam-matching
 * alleen bleek niet betrouwbaar). We onderscheiden daarom POSITIONEEL:
 * enkel links die verticaal tussen de "Already available..."-heading en
 * de "Add standard to shopping basket"-heading staan, tellen als bezeten.
 *
 * @returns welke taal effectief werd aangeklikt
 */
export async function clickOwnedLanguageVersion(page: Page): Promise<string> {
  // Wachten tot de sectie effectief gerenderd is, om race conditions te vermijden
  const ownedHeading = page.getByText('Already available in your standards collection');
  await ownedHeading.waitFor({ state: 'visible', timeout: 15000 });

  const ownedBox = await ownedHeading.boundingBox();
  const buyHeading = page.getByText('Add standard to shopping basket');
  const buyBox = await buyHeading.boundingBox().catch(() => null);

  const languages = ['French', 'English', 'German'];

  for (const lang of languages) {
    const link = page.getByRole('link', { name: lang, exact: true }).first();
    const isVisible = await link.isVisible().catch(() => false);
    if (!isVisible) continue;

    // Positioneel bevestigen dat deze link binnen de "owned"-sectie valt
    if (ownedBox && buyBox) {
      const linkBox = await link.boundingBox().catch(() => null);
      if (linkBox && linkBox.y >= ownedBox.y && linkBox.y < buyBox.y) {
        await link.click();
        return lang;
      }
      // Buiten de owned-sectie (dus vermoedelijk een koop-knop) — overslaan
      continue;
    }

    // Geen duidelijke sectiegrenzen gevonden (bv. "Add standard"-sectie
    // ontbreekt omdat alle talen al bezeten zijn) — gewoon de eerste
    // zichtbare match nemen
    await link.click();
    return lang;
  }

  throw new Error(
    `Geen enkele reeds-bezeten taalversie gevonden binnen de "Already available"-sectie.`
  );
}