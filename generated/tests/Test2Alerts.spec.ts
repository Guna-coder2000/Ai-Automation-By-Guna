import { test, expect } from '@playwright/test';
import { Test2AlertsPage } from '../pages/Test2AlertsPage';
import { Test2AlertsLocators } from '../locators/Test2AlertsLocators';

test("Test2Alerts: Click on 'Alert with OK' tab. Click the button to display an alert box. Verify alert appears and accept it. Click on 'Alert with OK & Cancel' tab. Click the button to display a confirm box and accept it. Click on 'Alert with Textbox' tab. Click the button to display a prompt box, enter text 'AI Automation' and accept it.", async ({ page }) => {
  test.setTimeout(60000);
  const test2AlertsPage = new Test2AlertsPage(page);

  await test.step("navigate https://demo.automationtesting.in/alerts.html", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m navigate https://demo.automationtesting.in/alerts.html");
    await test2AlertsPage.navigateToApplication();
    await expect(page).toHaveURL(Test2AlertsLocators.applicationUrl);
  });

  await test.step("fill prompt text", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill prompt text");
    await test2AlertsPage.enterTextOnPromptTextInput("AI Automation");
  });

  await test.step("assert visible page", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m assert visible page");
    await test2AlertsPage.verifyVisibleVisible();
  });
});
