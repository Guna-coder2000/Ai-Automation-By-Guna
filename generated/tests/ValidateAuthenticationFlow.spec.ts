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

  await test.step("fill username", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill username");
    await validateAuthenticationFlowPage.enterTextOnUsername(TestData.username);
  });

  await test.step("fill password", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill password");
    await validateAuthenticationFlowPage.enterTextOnPassword(TestData.password);
  });

  await test.step("click login button", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click login button");
    await validateAuthenticationFlowPage.clickLogin();
  });

  await test.step("assert visible inventory container", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m assert visible inventory container");
    await validateAuthenticationFlowPage.verifyInventoryContainerV();
  });

  await test.step("click react burger menu btn", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click react burger menu btn");
    await validateAuthenticationFlowPage.clickReactBurgerMenu();
  });

  await test.step("click logout sidebar link", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click logout sidebar link");
    await validateAuthenticationFlowPage.clickLogoutSidebarLink();
  });

  await test.step("assert visible login button", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m assert visible login button");
    await validateAuthenticationFlowPage.verifyLoginButtonVisible();
  });
});
