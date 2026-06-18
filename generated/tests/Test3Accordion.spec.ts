import { test, expect } from '@playwright/test';
import { Test3AccordionPage } from '../pages/Test3AccordionPage';
import { Test3AccordionLocators } from '../locators/Test3AccordionLocators';

test("Test3Accordion: Click on 'Collapsible Group 2 - Single Line Coding' to expand it. Verify the text inside is visible. Click on 'Collapsible Group 3 - Methhod Chaining' to expand it. Verify the text inside is visible.", async ({ page }) => {
  test.setTimeout(60000);
  const test3AccordionPage = new Test3AccordionPage(page);

  await test.step("navigate https://demo.automationtesting.in/accordion.html", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m navigate https://demo.automationtesting.in/accordion.html");
    await test3AccordionPage.navigateToApplication();
    await expect(page).toHaveURL(Test3AccordionLocators.applicationUrl);
  });

  await test.step("assert visible page", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m assert visible page");
    await test3AccordionPage.verifyVisibleVisible();
  });
});
