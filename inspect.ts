import { chromium } from "playwright";

(async () => {
  con source /workspaces/nbn-regression-demo/.venv/bin/activate
st browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto("https://app-qa.nbn.be/data/r/platform/frontend/login");

  console.log("TITLE:", await page.title());

  console.log(
    await page.locator("input").evaluateAll(inputs =>
      inputs.map(i => ({
        placeholder: i.getAttribute("placeholder"),
        type: i.getAttribute("type"),
        name: i.getAttribute("name")
      }))
    )
  );

  await browser.close();
})();
