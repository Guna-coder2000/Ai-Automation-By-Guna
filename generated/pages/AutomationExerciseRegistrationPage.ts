import { Page } from '@playwright/test';
import { BasePage } from '../../src/framework/BasePage';
import { CommonActions } from '../../src/framework/CommonActions';
import { AutomationExerciseRegistrationLocators } from '../locators/AutomationExerciseRegistrationLocators';

export class AutomationExerciseRegistrationPage extends BasePage {
  private readonly locators = AutomationExerciseRegistrationLocators;
  private readonly actions: CommonActions;

  constructor(page: Page) {
    super(page);
    this.actions = new CommonActions(page);
  }

  async navigateToApp(): Promise<void> {
    await this.navigateTo('https://automationexercise.com/');
  }

  async clickSignupLoginLink(): Promise<void> {
    await this.actions.clickOnElement(this.locators.signupLoginLink);
  }

  async enterTextOnSignupName(value: string): Promise<void> {
    await this.actions.clearAndEnterText(this.locators.signupName, value);
  }

  async enterTextOnSignupEmail(value: string): Promise<void> {
    await this.actions.clearAndEnterText(this.locators.signupEmail, value);
  }

  async clickSignup(): Promise<void> {
    await this.actions.clickOnElement(this.locators.signupButton);
  }

  async checkMrRadio(): Promise<void> {
    await this.actions.checkOnCheckboxElement(this.locators.mrRadio);
  }

  async enterTextOnPassword(value: string): Promise<void> {
    await this.actions.clearAndEnterText(this.locators.password, value);
  }

  async selectDays(value: string): Promise<void> {
    await this.actions.selectOptionByValueOnDropdown(this.locators.days, value);
  }

  async selectMonths(value: string): Promise<void> {
    await this.actions.selectOptionByValueOnDropdown(this.locators.months, value);
  }

  async selectYears(value: string): Promise<void> {
    await this.actions.selectOptionByValueOnDropdown(this.locators.years, value);
  }

  async clickCreateAccount(): Promise<void> {
    await this.actions.clickOnElement(this.locators.createAccountButton);
  }
}
