import { Page } from '@playwright/test';
import { BasePage } from '../../src/framework/BasePage';
import { CommonActions } from '../../src/framework/CommonActions';
import { DemoQADynamicComponentLocators } from '../locators/DemoQADynamicComponentLocators';

export class DemoQADynamicComponentPage extends BasePage {
  private readonly locators = DemoQADynamicComponentLocators;
  private readonly actions: CommonActions;

  constructor(page: Page) {
    super(page);
    this.actions = new CommonActions(page);
  }

  async navigateToApp(): Promise<void> {
    await this.navigateTo('https://demoqa.com/webtables');
  }

  async clickAddNewRecord(): Promise<void> {
    await this.actions.clickOnElement(this.locators.addNewRecordButton);
  }

  async enterTextOnFirstName(value: string): Promise<void> {
    await this.actions.clearAndEnterText(this.locators.firstName, value);
  }

  async enterTextOnLastName(value: string): Promise<void> {
    await this.actions.clearAndEnterText(this.locators.lastName, value);
  }

  async enterTextOnUserEmail(value: string): Promise<void> {
    await this.actions.clearAndEnterText(this.locators.userEmail, value);
  }

  async enterTextOnAge(value: string): Promise<void> {
    await this.actions.clearAndEnterText(this.locators.age, value);
  }

  async enterTextOnSalary(value: string): Promise<void> {
    await this.actions.clearAndEnterText(this.locators.salary, value);
  }

  async enterTextOnDepartment(value: string): Promise<void> {
    await this.actions.clearAndEnterText(this.locators.department, value);
  }

  async clickSubmit(): Promise<void> {
    await this.actions.clickOnElement(this.locators.submit);
  }

  async verifyNewRecordRowVisible(): Promise<void> {
    await this.actions.verifyVisible(this.locators.newRecordRow, 10000);
  }
}
