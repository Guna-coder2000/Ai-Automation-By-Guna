import { test, expect } from '@playwright/test';
import { OpenMRSPatientRegistrationPage } from '../pages/OpenMRSPatientRegistrationPage';
import { OpenMRSPatientRegistrationLocators, TestData } from '../locators/OpenMRSPatientRegistrationLocators';

test("OpenMRS Patient Registration", async ({ page }) => {
  test.setTimeout(60000);
  const openMRSPatientRegistrationPage = new OpenMRSPatientRegistrationPage(page);

  await test.step("navigate https://demo.openmrs.org/openmrs/login.htm", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m navigate https://demo.openmrs.org/openmrs/login.htm");
    await openMRSPatientRegistrationPage.navigateToApp();
    await expect(page).toHaveURL("https://demo.openmrs.org/openmrs/login.htm");
  });

  await test.step("fill username", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill username");
    await openMRSPatientRegistrationPage.enterTextOnUsername(TestData.username);
  });

  await test.step("fill password", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill password");
    await openMRSPatientRegistrationPage.enterTextOnPassword(TestData.password);
  });

  await test.step("click inpatient ward", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click inpatient ward");
    await openMRSPatientRegistrationPage.clickInpatientWard();
  });

  await test.step("click login button", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click login button");
    await openMRSPatientRegistrationPage.clickLogin();
  });

  await test.step("click register patient button", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click register patient button");
    await openMRSPatientRegistrationPage.clickRegisterPatient();
  });

  await test.step("fill given name", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill given name");
    await openMRSPatientRegistrationPage.enterTextOnGivenName(TestData.givenName);
  });

  await test.step("fill family name", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill family name");
    await openMRSPatientRegistrationPage.enterTextOnFamilyName(TestData.familyName);
  });

  await test.step("click next button", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click next button");
    await openMRSPatientRegistrationPage.clickNext();
  });

  await test.step("select gender", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m select gender");
    await openMRSPatientRegistrationPage.selectGender(TestData.gender);
  });

  await test.step("click next button", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click next button");
    await openMRSPatientRegistrationPage.clickNextStep11();
  });

  await test.step("fill birthdate day", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill birthdate day");
    await openMRSPatientRegistrationPage.enterTextOnBirthdateDay(TestData.birthdateDay);
  });

  await test.step("select birthdate month", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m select birthdate month");
    await openMRSPatientRegistrationPage.selectBirthdateMonth(TestData.birthdateMonth);
  });

  await test.step("fill birthdate year", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m fill birthdate year");
    await openMRSPatientRegistrationPage.enterTextOnBirthdateYear(TestData.birthdateYear);
  });

  await test.step("click next button", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click next button");
    await openMRSPatientRegistrationPage.clickNextStep15();
  });

  await test.step("click confirm button", async () => {

    console.log("\u001b[36m[STEP]\u001b[0m click confirm button");
    await openMRSPatientRegistrationPage.clickConfirm();
  });
});
