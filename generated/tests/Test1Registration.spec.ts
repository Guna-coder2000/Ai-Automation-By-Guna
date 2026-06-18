import { test, expect } from '@playwright/test';
import { Test1RegistrationPage } from '../pages/Test1RegistrationPage';
import { Test1RegistrationLocators } from '../locators/Test1RegistrationLocators';

test("Test1Registration: Fill in First Name, Last Name, Address, Email address, and Phone. Select Male for Gender. Select Cricket and Movies for Hobbies. Select Skills from dropdown. Select Country from dropdown. Select Year, Month, and Day for Date Of Birth. Enter Password and Confirm Password. Click Submit.", async ({ page }) => {
  test.setTimeout(60000);
  const test1RegistrationPage = new Test1RegistrationPage(page);

  await test.step("navigate https://demo.automationtesting.in/register.html", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m navigate https://demo.automationtesting.in/register.html");
    await test1RegistrationPage.navigateToApplication();
    await expect(page).toHaveURL(Test1RegistrationLocators.applicationUrl);
  });

  await test.step("fill password", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill password");
    await test1RegistrationPage.enterPasswordOnInput("Password123");
  });

  await test.step("click login button", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click login button");
    await test1RegistrationPage.submitLoginElement();
  });

  await test.step("fill first name", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill first name");
    await test1RegistrationPage.enterTextOnFirstNameInput("Ai");
  });

  await test.step("fill last name", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill last name");
    await test1RegistrationPage.enterTextOnLastNameInput("Agent");
  });

  await test.step("fill address", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill address");
    await test1RegistrationPage.enterTextOnAddressInput("123 AI Street, Tech City");
  });

  await test.step("fill email", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill email");
    await test1RegistrationPage.enterUsernameOnInput("test@ai.com");
  });

  await test.step("fill phone", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill phone");
    await test1RegistrationPage.enterTextOnPhoneInput("1234567890");
  });

  await test.step("click submit button", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click submit button");
    await test1RegistrationPage.submitFormElement();
  });
});
