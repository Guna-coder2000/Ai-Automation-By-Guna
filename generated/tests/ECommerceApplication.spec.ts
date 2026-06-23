import { test, expect } from '@playwright/test';
import { ECommerceApplicationPage } from '../pages/ECommerceApplicationPage';
import { ECommerceApplicationLocators, TestData } from '../locators/ECommerceApplicationLocators';

test("E-Commerce Application Product Management", async ({ page }) => {
  test.setTimeout(60000);
  const eCommerceApplicationPage = new ECommerceApplicationPage(page);

  await test.step("navigate https://demowebshop.tricentis.com/", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m navigate https://demowebshop.tricentis.com/");
    await eCommerceApplicationPage.navigateToApp();
    await expect(page).toHaveURL("https://demowebshop.tricentis.com/");
  });

  await test.step("fill search terms input", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill search terms input");
    await eCommerceApplicationPage.enterTextOnSearchTerms(TestData.searchTerms);
  });
});
