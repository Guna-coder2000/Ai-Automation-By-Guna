import { test, expect } from '@playwright/test';
import { Guru99InsuranceLoginPage } from '../pages/Guru99InsuranceLoginPage';
import { Guru99InsuranceLoginLocators, TestData } from '../locators/Guru99InsuranceLoginLocators';

test("Guru99 Insurance Login and Request", async ({ page }) => {
  test.setTimeout(60000);
  const guru99InsuranceLoginPage = new Guru99InsuranceLoginPage(page);

  await test.step("navigate https://demo.guru99.com/insurance/v1/index.php", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m navigate https://demo.guru99.com/insurance/v1/index.php");
    await guru99InsuranceLoginPage.navigateToApp();
    await expect(page).toHaveURL("https://demo.guru99.com/insurance/v1/index.php");
  });

  await test.step("fill email", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill email");
    await guru99InsuranceLoginPage.enterTextOnEmail(TestData.email);
  });

  await test.step("fill password", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill password");
    await guru99InsuranceLoginPage.enterTextOnPassword(TestData.password);
  });

  await test.step("click login button", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click login button");
    await guru99InsuranceLoginPage.clickLogin();
  });

  await test.step("click request quotation", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click request quotation");
    await guru99InsuranceLoginPage.clickRequestQuotation();
  });

  await test.step("select breakdowncover", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m select breakdowncover");
    await guru99InsuranceLoginPage.selectBreakdowncover(TestData.breakdowncover);
  });

  await test.step("click save quotation", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click save quotation");
    await guru99InsuranceLoginPage.clickSaveQuotation();
  });
});
