import { test, expect } from '@playwright/test';
import { AutomationExerciseRegistrationPage } from '../pages/AutomationExerciseRegistrationPage';
import { AutomationExerciseRegistrationLocators, TestData } from '../locators/AutomationExerciseRegistrationLocators';

test("Automation Exercise Registration", async ({ page }) => {
  test.setTimeout(60000);
  const automationExerciseRegistrationPage = new AutomationExerciseRegistrationPage(page);

  await test.step("navigate https://automationexercise.com/", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m navigate https://automationexercise.com/");
    await automationExerciseRegistrationPage.navigateToApp();
    await expect(page).toHaveURL("https://automationexercise.com/");
  });

  await test.step("click signup login link", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click signup login link");
    await automationExerciseRegistrationPage.clickSignupLoginLink();
  });

  await test.step("fill signup name", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill signup name");
    await automationExerciseRegistrationPage.enterTextOnSignupName(TestData.signupName);
  });

  await test.step("fill signup email", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill signup email");
    await automationExerciseRegistrationPage.enterTextOnSignupEmail(TestData.signupEmail);
  });

  await test.step("click signup button", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click signup button");
    await automationExerciseRegistrationPage.clickSignup();
  });

  await test.step("check mr radio", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m check mr radio");
    await automationExerciseRegistrationPage.checkMrRadio();
  });

  await test.step("fill password", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill password");
    await automationExerciseRegistrationPage.enterTextOnPassword(TestData.password);
  });

  await test.step("select days", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m select days");
    await automationExerciseRegistrationPage.selectDays(TestData.days);
  });

  await test.step("select months", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m select months");
    await automationExerciseRegistrationPage.selectMonths(TestData.months);
  });

  await test.step("select years", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m select years");
    await automationExerciseRegistrationPage.selectYears(TestData.years);
  });

  await test.step("click create account button", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click create account button");
    await automationExerciseRegistrationPage.clickCreateAccount();
  });
});
