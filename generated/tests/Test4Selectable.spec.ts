import { test, expect } from '@playwright/test';
import { Test4SelectablePage } from '../pages/Test4SelectablePage';
import { Test4SelectableLocators } from '../locators/Test4SelectableLocators';

test("Test4Selectable: Click on the 'Serialize' tab. Click on 'Sakinalium - Readability' from the list. Click on 'Sakinalium - Method Chaining'. Verify they are selected.", async ({ page }) => {
  test.setTimeout(60000);
  const test4SelectablePage = new Test4SelectablePage(page);

  await test.step("navigate https://demo.automationtesting.in/selectable.html", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m navigate https://demo.automationtesting.in/selectable.html");
    await test4SelectablePage.navigateToApplication();
    await expect(page).toHaveURL(Test4SelectableLocators.applicationUrl);
  });

  await test.step("assert visible page", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m assert visible page");
    await test4SelectablePage.verifyVisibleVisible();
  });
});
