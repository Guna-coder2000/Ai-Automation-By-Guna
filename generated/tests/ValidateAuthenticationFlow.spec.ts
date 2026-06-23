import { test, expect } from '@playwright/test';
import { ValidateAuthenticationFlowPage } from '../pages/ValidateAuthenticationFlowPage';
import { ValidateAuthenticationFlowLocators, TestData } from '../locators/ValidateAuthenticationFlowLocators';

test("Validate Authentication flow on SauceDemo", async ({ page }) => {
  test.setTimeout(60000);
  const validateAuthenticationFlowPage = new ValidateAuthenticationFlowPage(page);

  await test.step("navigate https://www.saucedemo.com/", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m navigate https://www.saucedemo.com/");
    await validateAuthenticationFlowPage.navigateToApp();
    await expect(page).toHaveURL("https://www.saucedemo.com/");
  });

  await test.step("fill username input", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill username input");
    await validateAuthenticationFlowPage.enterTextOnUsername(TestData.username);
  });

  await test.step("fill password input", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill password input");
    await validateAuthenticationFlowPage.enterTextOnPassword(TestData.password);
  });
});
