import { Page } from '@playwright/test';
import { BasePage } from '../../src/framework/BasePage';
import { CommonActions } from '../../src/framework/CommonActions';
import { OpenMRSPatientRegistrationLocators } from '../locators/OpenMRSPatientRegistrationLocators';

export class OpenMRSPatientRegistrationPage extends BasePage {
  private readonly locators = OpenMRSPatientRegistrationLocators;
  private readonly actions: CommonActions;

  constructor(page: Page) {
    super(page);
    this.actions = new CommonActions(page);
  }

  async navigateToApp(): Promise<void> {
    await this.navigateTo('https://demo.openmrs.org/openmrs/login.htm');
  }

  async enterTextOnUsername(value: string): Promise<void> {
    await this.actions.clearAndEnterText(this.locators.username, value);
  }

  async enterTextOnPassword(value: string): Promise<void> {
    await this.actions.clearAndEnterText(this.locators.password, value);
  }

  async clickInpatientWard(): Promise<void> {
    await this.actions.clickOnElement(this.locators.inpatientWard);
  }

  async clickLogin(): Promise<void> {
    await this.actions.clickOnElement(this.locators.loginButton);
  }

  async clickRegisterPatient(): Promise<void> {
    await this.actions.clickOnElement(this.locators.registerPatientButton);
  }

  async enterTextOnGivenName(value: string): Promise<void> {
    await this.actions.clearAndEnterText(this.locators.givenName, value);
  }

  async enterTextOnFamilyName(value: string): Promise<void> {
    await this.actions.clearAndEnterText(this.locators.familyName, value);
  }

  async clickNext(): Promise<void> {
    await this.actions.clickOnElement(this.locators.nextButton);
  }

  async selectGender(value: string): Promise<void> {
    await this.actions.selectOptionByValueOnDropdown(this.locators.gender, value);
  }

  async clickNextStep11(): Promise<void> {
    await this.actions.clickOnElement(this.locators.nextButton);
  }

  async enterTextOnBirthdateDay(value: string): Promise<void> {
    await this.actions.clearAndEnterText(this.locators.birthdateDay, value);
  }

  async selectBirthdateMonth(value: string): Promise<void> {
    await this.actions.selectOptionByValueOnDropdown(this.locators.birthdateMonth, value);
  }

  async enterTextOnBirthdateYear(value: string): Promise<void> {
    await this.actions.clearAndEnterText(this.locators.birthdateYear, value);
  }

  async clickNextStep15(): Promise<void> {
    await this.actions.clickOnElement(this.locators.nextButton);
  }

  async clickConfirm(): Promise<void> {
    await this.actions.clickOnElement(this.locators.confirmButton);
  }
}
