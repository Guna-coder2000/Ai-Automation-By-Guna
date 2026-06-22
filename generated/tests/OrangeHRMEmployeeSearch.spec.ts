import { test, expect } from '@playwright/test';
import { OrangeHRMEmployeeSearchPage } from '../pages/OrangeHRMEmployeeSearchPage';
import { OrangeHRMEmployeeSearchLocators, TestData } from '../locators/OrangeHRMEmployeeSearchLocators';

test("OrangeHRM Employee Search", async ({ page }) => {
  test.setTimeout(60000);
  const orangeHRMEmployeeSearchPage = new OrangeHRMEmployeeSearchPage(page);

  await test.step("navigate https://opensource demo.orangehrmlive.com/", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m navigate https://opensource demo.orangehrmlive.com/");
    await orangeHRMEmployeeSearchPage.navigateToApp();
    await expect(page).toHaveURL("https://opensource-demo.orangehrmlive.com/");
  });

  await test.step("fill username", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill username");
    await orangeHRMEmployeeSearchPage.enterTextOnUsername(TestData.username);
  });

  await test.step("fill password", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill password");
    await orangeHRMEmployeeSearchPage.enterTextOnPassword(TestData.password);
  });

  await test.step("click login button", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click login button");
    await orangeHRMEmployeeSearchPage.clickLogin();
  });

  await test.step("click pim module link", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click pim module link");
    await orangeHRMEmployeeSearchPage.clickPimModuleLink();
  });

  await test.step("fill employee name input", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill employee name input");
    await orangeHRMEmployeeSearchPage.enterTextOnEmployeeName(TestData.employeeNameInput);
  });

  await test.step("click search button", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click search button");
    await orangeHRMEmployeeSearchPage.clickSearch();
  });

  await test.step("assert visible employee record", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m assert visible employee record");
    await orangeHRMEmployeeSearchPage.verifyEmployeeRecordVisib();
  });
});
