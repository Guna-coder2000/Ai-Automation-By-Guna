import { Page } from '@playwright/test';
import { BasePage } from '../../src/framework/BasePage';
import { CommonActions } from '../../src/framework/CommonActions';
import { SuiteCRMCreateLeadLocators } from '../locators/SuiteCRMCreateLeadLocators';

export class SuiteCRMCreateLeadPage extends BasePage {
  private readonly locators = SuiteCRMCreateLeadLocators;
  private readonly actions: CommonActions;

  constructor(page: Page) {
    super(page);
    this.actions = new CommonActions(page);
  }

  async navigateToApp(): Promise<void> {
    await this.navigateTo('https://demo.suiteondemand.com/');
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

  async clickSalesMenu(): Promise<void> {
    await this.actions.clickOnElement(this.locators.salesMenu);
  }

  async clickLeadsLink(): Promise<void> {
    await this.actions.clickOnElement(this.locators.leadsLink);
  }

  async clickCreateLead(): Promise<void> {
    await this.actions.clickOnElement(this.locators.createLeadButton);
  }

  async enterTextOnFirstName(value: string): Promise<void> {
    await this.actions.clearAndEnterText(this.locators.firstName, value);
  }

  async enterTextOnLastName(value: string): Promise<void> {
    await this.actions.clearAndEnterText(this.locators.lastName, value);
  }

  async clickSave(): Promise<void> {
    await this.actions.clickOnElement(this.locators.saveButton);
  }
}
