import { test, expect } from '@playwright/test';
import { login } from '../helpers/login';

/**
 * RT-LOGIN-004 – Logout
 *
 * Selectors bevestigd via Codegen-opname op 14/07:
 * - Profielmenu-knop: getByRole('button', { name: 'J' })
 * - Logout-link: getByRole('link', { name: 'Logout' })
 */

test.describe('RT-LOGIN-004 – Logout', () => {
  test('a logged-in user can successfully log out', async ({ page }) => {
    // Precondition: gebruiker is ingelogd
    await login(page, process.env.NBN_QA_EMAIL!, process.env.NBN_QA_PASSWORD!);

    // Stap 1: profielmenu openen
    await page.getByRole('button', { name: 'J' }).click();

    // Stap 2: Log Out selecteren
    await page.getByRole('link', { name: 'Logout' }).click();

    // --- Assertions (Expected Result) ---

    // De gebruiker wordt doorgestuurd naar de loginpagina of publieke homepage
    // TODO: bevestig de exacte URL na logout (nu breed genoeg om beide toe te laten)
    await page.waitForLoadState('networkidle');
    // await expect(page).toHaveURL(/TODO_POST_LOGOUT_URL_PATTERN/);

    // Beveiligde pagina's zijn niet langer bereikbaar:
    // probeer terug naar de ingelogde homepage te gaan, en verwacht een
    // redirect terug naar de loginpagina.
    await page.goto('https://app-qa.nbn.be/data/r/platform/frontend/home');
    await expect(page).toHaveURL(/login/);
  });
});
//$ npx playwright test tests/RT-LOGIN-004.spec.ts --project=chromium