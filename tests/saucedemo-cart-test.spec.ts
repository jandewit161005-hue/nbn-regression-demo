import { test, expect } from '@playwright/test';

test('add item to cart and verify price + count', async ({ page }) => {

    await page.goto('https://www.saucedemo.com/');

    await page.getByPlaceholder('Username').fill('standard_user');
    await page.getByPlaceholder('Password').fill('secret_sauce');

    await page.getByRole('button', { name: 'Login' }).click();


    const productName = 'Sauce Labs Backpack';

    const productCard = page.locator('.inventory_item', {
        hasText: productName
    });

    const listedPrice = await productCard
        .locator('.inventory_item_price')
        .innerText();


    await productCard
        .getByRole('button', { name: 'Add to cart' })
        .click();


    await expect(page.locator('.shopping_cart_badge'))
        .toHaveText('1');


    await page.locator('.shopping_cart_link').click();


    const cartItem = page.locator('.cart_item', {
        hasText: productName
    });

    const cartPrice = await cartItem
        .locator('.inventory_item_price')
        .innerText();


    expect(cartPrice).toBe(listedPrice);

}); 