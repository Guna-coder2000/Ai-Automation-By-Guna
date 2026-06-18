import { Page } from '@playwright/test';
import { BasePage } from '../../src/framework/BasePage';
import { CommonActions } from '../../src/framework/CommonActions';
import { Test1RegistrationLocators } from '../locators/Test1RegistrationLocators';

export class Test1RegistrationPage extends BasePage {
  private readonly locators = Test1RegistrationLocators;
  private readonly actions: CommonActions;

  constructor(page: Page) {
    super(page);
    this.actions = new CommonActions(page);
  }

  async navigateToApplication(): Promise<void> {
    await this.navigateTo(this.locators.applicationUrl);
  }

  async enterPasswordOnInput(value: string): Promise<void> {
    await this.actions.clearAndEnterText(this.locators.password, value);
  }

  async submitLoginElement(): Promise<void> {
    await this.actions.clickOnElement(this.locators.loginButton);
  }

  async enterTextOnFirstNameInput(value: string): Promise<void> {
    await this.actions.clearAndEnterText(this.locators.firstName, value);
  }

  async enterTextOnLastNameInput(value: string): Promise<void> {
    await this.actions.clearAndEnterText(this.locators.lastName, value);
  }

  async enterTextOnAddressInput(value: string): Promise<void> {
    await this.actions.clearAndEnterText(this.locators.address, value);
  }

  async enterUsernameOnInput(value: string): Promise<void> {
    await this.actions.clearAndEnterText(this.locators.email, value);
  }

  async enterTextOnPhoneInput(value: string): Promise<void> {
    await this.actions.clearAndEnterText(this.locators.phone, value);
  }

  async submitFormElement(): Promise<void> {
    await this.actions.clickOnElement(this.locators.loginButton);
  }
}
