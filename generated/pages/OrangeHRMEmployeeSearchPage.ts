import { Page } from '@playwright/test';
import { BasePage } from '../../src/framework/BasePage';
import { CommonActions } from '../../src/framework/CommonActions';
import { OrangeHRMEmployeeSearchLocators } from '../locators/OrangeHRMEmployeeSearchLocators';

export class OrangeHRMEmployeeSearchPage extends BasePage {
  private readonly locators = OrangeHRMEmployeeSearchLocators;
  private readonly actions: CommonActions;

  constructor(page: Page) {
    super(page);
    this.actions = new CommonActions(page);
  }

  async navigateToApp(): Promise<void> {
    await this.navigateTo('https://opensource-demo.orangehrmlive.com/');
  }

  async enterTextOnUsername(value: string): Promise<void> {
    await this.actions.clearAndEnterText(this.locators.username, value);
  }

  async enterTextOnPassword(value: string): Promise<void> {
    await this.actions.clearAndEnterText(this.locators.password, value);
  }

  async clickLogin(): Promise<void> {
    await this.actions.clickOnElement(this.locators.loginButton);
  }

  async clickPimModuleLink(): Promise<void> {
    await this.actions.clickOnElement(this.locators.pimModuleLink);
  }

  async enterTextOnEmployeeName(value: string): Promise<void> {
    await this.actions.clearAndEnterText(this.locators.employeeNameInput, value);
  }

  async clickSearch(): Promise<void> {
    await this.actions.clickOnElement(this.locators.searchButton);
  }

  async verifyEmployeeRecordVisib(): Promise<void> {
    await this.actions.verifyVisible(this.locators.employeeRecord, 10000);
  }
}
