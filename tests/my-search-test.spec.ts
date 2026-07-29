import { test, expect } from '@playwright/test';
test('search finds results', async ({ page } ) => {await page.goto('https://playwright.dev/'); await page.getByRole('button', { name: 'search' }).click(); await page.getByPlaceholder('search docs').fill('locators');await expect(page.getByRole('link', { name: 'Locators', exact: true })).toBeVisible();}); 
