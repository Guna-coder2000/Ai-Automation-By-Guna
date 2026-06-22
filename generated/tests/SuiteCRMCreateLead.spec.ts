import { test, expect } from '@playwright/test';
import { SuiteCRMCreateLeadPage } from '../pages/SuiteCRMCreateLeadPage';
import { SuiteCRMCreateLeadLocators, TestData } from '../locators/SuiteCRMCreateLeadLocators';

test("SuiteCRM Create Lead", async ({ page }) => {
  test.setTimeout(60000);
  const suiteCRMCreateLeadPage = new SuiteCRMCreateLeadPage(page);

  await test.step("navigate https://demo.suiteondemand.com/", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m navigate https://demo.suiteondemand.com/");
    await suiteCRMCreateLeadPage.navigateToApp();
    await expect(page).toHaveURL("https://demo.suiteondemand.com/");
  });

  await test.step("fill username", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill username");
    await suiteCRMCreateLeadPage.enterTextOnUsername(TestData.username);
  });

  await test.step("fill password", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill password");
    await suiteCRMCreateLeadPage.enterTextOnPassword(TestData.username);
  });

  await test.step("click login button", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click login button");
    await suiteCRMCreateLeadPage.clickLogin();
  });

  await test.step("click sales menu", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click sales menu");
    await suiteCRMCreateLeadPage.clickSalesMenu();
  });

  await test.step("click leads link", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click leads link");
    await suiteCRMCreateLeadPage.clickLeadsLink();
  });

  await test.step("click create lead button", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click create lead button");
    await suiteCRMCreateLeadPage.clickCreateLead();
  });

  await test.step("fill first name", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill first name");
    await suiteCRMCreateLeadPage.enterTextOnFirstName(TestData.firstName);
  });

  await test.step("fill last name", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill last name");
    await suiteCRMCreateLeadPage.enterTextOnLastName(TestData.lastName);
  });

  await test.step("click save button", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click save button");
    await suiteCRMCreateLeadPage.clickSave();
  });
});
