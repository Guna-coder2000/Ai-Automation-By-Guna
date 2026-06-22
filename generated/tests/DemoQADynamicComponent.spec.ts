import { test, expect } from '@playwright/test';
import { DemoQADynamicComponentPage } from '../pages/DemoQADynamicComponentPage';
import { DemoQADynamicComponentLocators, TestData } from '../locators/DemoQADynamicComponentLocators';

test("DemoQA Dynamic Component Testing", async ({ page }) => {
  test.setTimeout(60000);
  const demoQADynamicComponentPage = new DemoQADynamicComponentPage(page);

  await test.step("navigate https://demoqa.com/webtables", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m navigate https://demoqa.com/webtables");
    await demoQADynamicComponentPage.navigateToApp();
    await expect(page).toHaveURL("https://demoqa.com/webtables");
  });

  await test.step("click add new record button", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click add new record button");
    await demoQADynamicComponentPage.clickAddNewRecord();
  });

  await test.step("fill first name", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill first name");
    await demoQADynamicComponentPage.enterTextOnFirstName(TestData.firstName);
  });

  await test.step("fill last name", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill last name");
    await demoQADynamicComponentPage.enterTextOnLastName(TestData.lastName);
  });

  await test.step("fill user email", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill user email");
    await demoQADynamicComponentPage.enterTextOnUserEmail(TestData.userEmail);
  });

  await test.step("fill age", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill age");
    await demoQADynamicComponentPage.enterTextOnAge(TestData.age);
  });

  await test.step("fill salary", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill salary");
    await demoQADynamicComponentPage.enterTextOnSalary(TestData.salary);
  });

  await test.step("fill department", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill department");
    await demoQADynamicComponentPage.enterTextOnDepartment(TestData.department);
  });

  await test.step("click submit", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click submit");
    await demoQADynamicComponentPage.clickSubmit();
  });

  await test.step("assert visible new record row", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m assert visible new record row");
    await demoQADynamicComponentPage.verifyNewRecordRowVisible();
  });
});
