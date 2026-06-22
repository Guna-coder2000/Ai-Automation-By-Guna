import { test, expect } from '@playwright/test';
import { UnnamedScenarioPage } from '../pages/UnnamedScenarioPage';
import { UnnamedScenarioLocators, TestData } from '../locators/UnnamedScenarioLocators';

test("UnnamedScenario", async ({ page }) => {
  test.setTimeout(60000);
  const unnamedScenarioPage = new UnnamedScenarioPage(page);

  await test.step("navigate https://the internet.herokuapp.com/", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m navigate https://the internet.herokuapp.com/");
    await unnamedScenarioPage.navigateToApp();
    await expect(page).toHaveURL("https://the-internet.herokuapp.com/");
  });

  await test.step("click javascript alerts link", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click javascript alerts link");
    await unnamedScenarioPage.clickJavascriptAlertsLink();
  });

  await test.step("click js alert button", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click js alert button");
    await unnamedScenarioPage.clickJsAlert();
  });

  await test.step("navigate https://the internet.herokuapp.com/", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m navigate https://the internet.herokuapp.com/");
    await unnamedScenarioPage.navigateToAppStep4();
    await expect(page).toHaveURL("https://the-internet.herokuapp.com/");
  });

  await test.step("click dynamic controls link", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click dynamic controls link");
    await unnamedScenarioPage.clickDynamicControlsLink();
  });

  await test.step("click remove checkbox button", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click remove checkbox button");
    await unnamedScenarioPage.clickRemoveCheckbox();
  });
});
