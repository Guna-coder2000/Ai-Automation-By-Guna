import { test, expect } from '@playwright/test';
import { Test5IframePage } from '../pages/Test5IframePage';
import { Test5IframeLocators } from '../locators/Test5IframeLocators';

test("Test5Iframe: Locate the Youtube video iframe. Switch into the iframe context and click the Play button on the youtube video.", async ({ page }) => {
  test.setTimeout(60000);
  const test5IframePage = new Test5IframePage(page);

  await test.step("navigate https://demo.automationtesting.in/youtube.html", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m navigate https://demo.automationtesting.in/youtube.html");
    await test5IframePage.navigateToApplication();
    await expect(page).toHaveURL(Test5IframeLocators.applicationUrl);
  });

  await test.step("assert visible page", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m assert visible page");
    await test5IframePage.verifyVisibleVisible();
  });
});
