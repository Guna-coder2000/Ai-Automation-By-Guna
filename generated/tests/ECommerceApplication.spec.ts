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

  await test.step("fill search terms", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill search terms");
    await eCommerceApplicationPage.enterTextOnSearchTerms(TestData.searchTerms);
  });

  await test.step("click search button", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click search button");
    await eCommerceApplicationPage.clickSearch();
  });

  await test.step("assert visible product item", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m assert visible product item");
    await eCommerceApplicationPage.verifyProductItemVisible();
  });

  await test.step("click add to cart button", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click add to cart button");
    await eCommerceApplicationPage.clickAddToCart();
  });

  await test.step("assert visible bar notification", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m assert visible bar notification");
    await eCommerceApplicationPage.verifyBarNotificationVisi();
  });

  await test.step("click shopping cart link", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click shopping cart link");
    await eCommerceApplicationPage.clickShoppingCartLink();
  });

  await test.step("click removefromcart", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click removefromcart");
    await eCommerceApplicationPage.clickRemovefromcart();
  });

  await test.step("click updatecart", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click updatecart");
    await eCommerceApplicationPage.clickUpdatecart();
  });
});
