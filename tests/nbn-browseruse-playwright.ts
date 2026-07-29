import { test } from '@playwright/test';
import 'dotenv/config';

const EMAIL = process.env.NBN_QA_EMAIL || '';
const PASSWORD = process.env.NBN_QA_PASSWORD || '';
const LOGIN_URL = 'https://app-qa.nbn.be/data/r/platform/frontend/login';
const NORM_QUERY = 'NBN EN 1090';

async function dumpInputs(page: any, label: string) {
  const inputs = await page.locator('input').evaluateAll((els: any[]) =>
    els.map((el) => ({
      placeholder: el.getAttribute('placeholder'),
      type: el.getAttribute('type'),
      name: el.getAttribute('name'),
      id: el.getAttribute('id'),
    }))
  );
  console.log(`\n=== INPUTS (${label}) ===`);
  console.log(JSON.stringify(inputs, null, 2));
}

async function dumpButtonsAndLinks(page: any, label: string) {
  const buttons = await page.locator('button').evaluateAll((els: any[]) =>
    els.map((el) => ({ text: el.textContent?.trim(), type: el.getAttribute('type'), id: el.getAttribute('id') }))
  );
  const links = await page.locator('a').evaluateAll((els: any[]) =>
    els.map((el) => ({ text: el.textContent?.trim(), href: el.getAttribute('href') }))
      .filter((l: any) => l.text && l.text.length > 0)
  );
  console.log(`\n=== BUTTONS (${label}) ===`);
  console.log(JSON.stringify(buttons, null, 2));
  console.log(`\n=== LINKS (${label}, met tekst) ===`);
  console.log(JSON.stringify(links.slice(0, 30), null, 2)); // eerste 30, anders te veel ruis
}

test('volledige locator-inspectie: login -> home -> zoeken -> detail', async ({ page }) => {
  test.setTimeout(120_000);

  // --- STAP 1: Login ---
  await page.goto(LOGIN_URL, { waitUntil: 'networkidle' });

  const denyButton = page.getByRole('button', { name: 'Deny all' });
  if (await denyButton.isVisible().catch(() => false)) {
    await denyButton.click();
    console.log('Cookiebanner gesloten.');
  }

  await page.locator('#P9999_USERNAME').fill(EMAIL);
  await page.locator('#P9999_PASSWORD').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await page.waitForURL(/home/, { timeout: 15000 }).catch(() => {
    console.log('WAARSCHUWING: geen redirect naar /home gedetecteerd binnen 15s. Huidige URL:', page.url());
  });

  console.log('\nNa login, huidige URL:', page.url());
  await page.screenshot({ path: 'inspect-2-home.png', fullPage: true });

  // --- STAP 2: Home-pagina volledig dumpen ---
  await dumpInputs(page, 'home-pagina');
  await dumpButtonsAndLinks(page, 'home-pagina');

  // --- STAP 3: Poging tot zoeken ---
  // Kandidaat-selectors, in volgorde van waarschijnlijkheid voor een APEX-app.
  const searchCandidates = [
    'input[type="search"]',
    'input[placeholder*="zoek" i]',
    'input[placeholder*="search" i]',
    'input[id*="SEARCH" i]',
    'input[name*="SEARCH" i]',
  ];

  let searchInput = null;
  for (const sel of searchCandidates) {
    const loc = page.locator(sel).first();
    if (await loc.isVisible().catch(() => false)) {
      searchInput = loc;
      console.log(`\nZoekveld gevonden met selector: ${sel}`);
      break;
    }
  }

  if (!searchInput) {
    console.log('\nGEEN zoekveld gevonden met de kandidaat-selectors hierboven.');
    console.log('Bekijk de INPUTS-dump van de home-pagina hierboven om het juiste veld te identificeren.');
    return; // stop hier, we hebben al waardevolle info
  }

  await searchInput.fill(NORM_QUERY);
  await searchInput.press('Enter');
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.screenshot({ path: 'inspect-3-results.png', fullPage: true });

  console.log('\nNa zoeken, huidige URL:', page.url());
  await dumpButtonsAndLinks(page, 'zoekresultaten');

  // --- STAP 4: Klik op eerste resultaat dat de norm-naam bevat ---
  const resultLink = page.getByText(NORM_QUERY).first();
  if (await resultLink.isVisible().catch(() => false)) {
    await resultLink.click();
    await page.waitForLoadState('networkidle').catch(() => {});
    console.log('\nNa klik op resultaat, huidige URL:', page.url());
    await page.screenshot({ path: 'inspect-4-detail.png', fullPage: true });

    // Dump volledige zichtbare tekst van de detailpagina (makkelijker dan HTML voor dit doel)
    const bodyText = await page.locator('body').innerText();
    console.log('\n=== VOLLEDIGE TEKST DETAILPAGINA (eerste 2000 tekens) ===');
    console.log(bodyText.slice(0, 2000));
  } else {
    console.log(`\nGEEN klikbaar element met tekst "${NORM_QUERY}" gevonden op de resultatenpagina.`);
    console.log('Bekijk inspect-3-results.png en de LINKS-dump hierboven.');
  }
});