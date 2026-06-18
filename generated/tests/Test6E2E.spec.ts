import { test, expect } from '@playwright/test';
import { Test6E2EPage } from '../pages/Test6E2EPage';
import { Test6E2ELocators } from '../locators/Test6E2ELocators';

test("Test6E2E: 1. On the Register page, fill in the First Name, Last Name, Email address, and Phone number. Select Male for Gender. Click Submit. 2. Navigate to https://demo.automationtesting.in/Alerts.html and click the button to display an alert box and automatically accept the browser alert. 3. Navigate to https://demo.automationtesting.in/Accordion.html and click on 'Collapsible Group 2 - Single Line Coding' to expand the accordion and verify it opens. 4. Navigate to https://demo.automationtesting.in/Selectable.html and click on 'Serialize' tab. Then click on 'Sakinalium - Readability' from the list of selectable items. 5. Navigate to https://demo.automationtesting.in/Youtube.html and locate the Youtube video iframe. Switch into the iframe context and click the Play button on the youtube video.", async ({ page }) => {
  test.setTimeout(60000);
  const test6E2EPage = new Test6E2EPage(page);

  await test.step("navigate https://demo.automationtesting.in/register.html", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m navigate https://demo.automationtesting.in/register.html");
    await test6E2EPage.navigateToApplication();
    await expect(page).toHaveURL("https://demo.automationtesting.in/Register.html");
  });

  await test.step("fill first name", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill first name");
    await test6E2EPage.enterTextOnFirstNameInput("AI");
  });

  await test.step("fill last name", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill last name");
    await test6E2EPage.enterTextOnLastNameInput("Agent");
  });

  await test.step("fill email", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill email");
    await test6E2EPage.enterUsernameOnInput("ai.agent@example.com");
  });

  await test.step("fill phone", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill phone");
    await test6E2EPage.enterTextOnPhoneInput("9876543210");
  });

  await test.step("click gender male", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click gender male");
    await test6E2EPage.clickOnGenderMaleElement();
  });

  await test.step("click submit", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click submit");
    await test6E2EPage.submitFormElement();
  });

  await test.step("navigate https://demo.automationtesting.in/alerts.html", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m navigate https://demo.automationtesting.in/alerts.html");
    await test6E2EPage.navigateToApplicationStep8();
    await expect(page).toHaveURL("https://demo.automationtesting.in/Alerts.html");
  });

  await test.step("click alert box button", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click alert box button");
    await test6E2EPage.clickOnAlertBoxElement();
  });

  await test.step("navigate https://demo.automationtesting.in/accordion.html", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m navigate https://demo.automationtesting.in/accordion.html");
    await test6E2EPage.navigateToApplicationStep10();
    await expect(page).toHaveURL("https://demo.automationtesting.in/Accordion.html");
  });

  await test.step("click group2", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click group2");
    await test6E2EPage.clickOnGroup2Element();
  });

  await test.step("navigate https://demo.automationtesting.in/selectable.html", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m navigate https://demo.automationtesting.in/selectable.html");
    await test6E2EPage.navigateToApplicationStep12();
    await expect(page).toHaveURL("https://demo.automationtesting.in/Selectable.html");
  });

  await test.step("click serialize tab", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click serialize tab");
    await test6E2EPage.openSerializeTabElement();
  });

  await test.step("click readability item", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click readability item");
    await test6E2EPage.clickOnReadabilityItemElement();
  });

  await test.step("navigate https://demo.automationtesting.in/youtube.html", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m navigate https://demo.automationtesting.in/youtube.html");
    await test6E2EPage.navigateToApplicationStep15();
    await expect(page).toHaveURL("https://demo.automationtesting.in/Youtube.html");
  });
});
