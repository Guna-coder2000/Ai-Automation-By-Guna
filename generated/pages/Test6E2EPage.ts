import { Page } from '@playwright/test';
import { BasePage } from '../../src/framework/BasePage';
import { CommonActions } from '../../src/framework/CommonActions';
import { Test6E2ELocators } from '../locators/Test6E2ELocators';

export class Test6E2EPage extends BasePage {
  private readonly locators = Test6E2ELocators;
  private readonly actions: CommonActions;

  constructor(page: Page) {
    super(page);
    this.actions = new CommonActions(page);
  }

  async navigateToApplication(): Promise<void> {
    await this.navigateTo('https://demo.automationtesting.in/Register.html');
  }

  async enterTextOnFirstNameInput(value: string): Promise<void> {
    await this.actions.clearAndEnterText(this.locators.firstName, value);
  }

  async enterTextOnLastNameInput(value: string): Promise<void> {
    await this.actions.clearAndEnterText(this.locators.lastName, value);
  }

  async enterUsernameOnInput(value: string): Promise<void> {
    await this.actions.clearAndEnterText(this.locators.email, value);
  }

  async enterTextOnPhoneInput(value: string): Promise<void> {
    await this.actions.clearAndEnterText(this.locators.phone, value);
  }

  async clickOnGenderMaleElement(): Promise<void> {
    await this.actions.clickOnElement(this.locators.genderMale);
  }

  async submitFormElement(): Promise<void> {
    await this.actions.clickOnElement(this.locators.submit);
  }

  async navigateToApplicationStep8(): Promise<void> {
    await this.navigateTo('https://demo.automationtesting.in/Alerts.html');
  }

  async clickOnAlertBoxElement(): Promise<void> {
    await this.actions.clickOnElement(this.locators.alertBoxButton);
  }

  async navigateToApplicationStep10(): Promise<void> {
    await this.navigateTo('https://demo.automationtesting.in/Accordion.html');
  }

  async clickOnGroup2Element(): Promise<void> {
    await this.actions.clickOnElement(this.locators.group2);
  }

  async navigateToApplicationStep12(): Promise<void> {
    await this.navigateTo('https://demo.automationtesting.in/Selectable.html');
  }

  async openSerializeTabElement(): Promise<void> {
    await this.actions.clickOnElement(this.locators.serializeTab);
  }

  async clickOnReadabilityItemElement(): Promise<void> {
    await this.actions.clickOnElement(this.locators.readabilityItem);
  }

  async navigateToApplicationStep15(): Promise<void> {
    await this.navigateTo('https://demo.automationtesting.in/Youtube.html');
  }
}
