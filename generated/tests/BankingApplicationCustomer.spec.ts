import { test, expect } from '@playwright/test';
import { BankingApplicationCustomerPage } from '../pages/BankingApplicationCustomerPage';
import { BankingApplicationCustomerLocators, TestData } from '../locators/BankingApplicationCustomerLocators';

test("Banking Application Customer Flow", async ({ page }) => {
  test.setTimeout(60000);
  const bankingApplicationCustomerPage = new BankingApplicationCustomerPage(page);

  await test.step("navigate https://www.globalsqa.com/angular js protractor/banking project/#/login", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m navigate https://www.globalsqa.com/angular js protractor/banking project/#/login");
    await bankingApplicationCustomerPage.navigateToApp();
    await expect(page).toHaveURL("https://www.globalsqa.com/angularJs-protractor/BankingProject/#/login");
  });

  await test.step("click customer login button", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click customer login button");
    await bankingApplicationCustomerPage.clickCustomerLogin();
  });

  await test.step("select user select", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m select user select");
    await bankingApplicationCustomerPage.selectUserSelect(TestData.userSelect);
  });

  await test.step("click login button", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click login button");
    await bankingApplicationCustomerPage.clickLogin();
  });

  await test.step("click deposit tab", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click deposit tab");
    await bankingApplicationCustomerPage.clickDepositTab();
  });

  await test.step("fill amount input", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill amount input");
    await bankingApplicationCustomerPage.enterTextOnAmount(TestData.amountInput);
  });

  await test.step("click deposit submit button", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click deposit submit button");
    await bankingApplicationCustomerPage.clickDepositSubmit();
  });

  await test.step("assert text message", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m assert text message");
    await bankingApplicationCustomerPage.verifyMessageText(TestData.message);
  });

  await test.step("click withdraw tab", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click withdraw tab");
    await bankingApplicationCustomerPage.clickWithdrawTab();
  });

  await test.step("fill amount input", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill amount input");
    await bankingApplicationCustomerPage.enterTextOnAmountStep10(TestData.amountInput);
  });

  await test.step("click withdraw submit button", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click withdraw submit button");
    await bankingApplicationCustomerPage.clickWithdrawSubmit();
  });

  await test.step("assert text message", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m assert text message");
    await bankingApplicationCustomerPage.verifyMessageTextStep12(TestData.message);
  });
});
