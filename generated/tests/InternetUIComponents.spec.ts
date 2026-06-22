import { test, expect } from '@playwright/test';
import { InternetUIComponentsPage } from '../pages/InternetUIComponentsPage';
import { InternetUIComponentsLocators, TestData } from '../locators/InternetUIComponentsLocators';

test("The Internet UI Components Testing", async ({ page }) => {
  test.setTimeout(60000);
  const internetUIComponentsPage = new InternetUIComponentsPage(page);

  await test.step("navigate https://the internet.herokuapp.com/", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m navigate https://the internet.herokuapp.com/");
    await internetUIComponentsPage.navigateToApp();
    await expect(page).toHaveURL("https://the-internet.herokuapp.com/");
  });

  await test.step("click javascript alerts link", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click javascript alerts link");
    await internetUIComponentsPage.clickJavascriptAlertsLink();
  });

  await test.step("click js alert button", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click js alert button");
    await internetUIComponentsPage.clickJsAlert();
  });

  await test.step("navigate https://the internet.herokuapp.com/", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m navigate https://the internet.herokuapp.com/");
    await internetUIComponentsPage.navigateToAppStep4();
    await expect(page).toHaveURL("https://the-internet.herokuapp.com/");
  });

  await test.step("click dynamic controls link", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click dynamic controls link");
    await internetUIComponentsPage.clickDynamicControlsLink();
  });

  await test.step("click remove checkbox button", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click remove checkbox button");
    await internetUIComponentsPage.clickRemoveCheckbox();
  });

  await test.step("assert visible checkbox gone message", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m assert visible checkbox gone message");
    await internetUIComponentsPage.verifyCheckboxGoneMessage();
  });
});
