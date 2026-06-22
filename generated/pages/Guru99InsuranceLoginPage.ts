import { Page } from '@playwright/test';
import { BasePage } from '../../src/framework/BasePage';
import { CommonActions } from '../../src/framework/CommonActions';
import { Guru99InsuranceLoginLocators } from '../locators/Guru99InsuranceLoginLocators';

export class Guru99InsuranceLoginPage extends BasePage {
  private readonly locators = Guru99InsuranceLoginLocators;
  private readonly actions: CommonActions;

  constructor(page: Page) {
    super(page);
    this.actions = new CommonActions(page);
  }

  async navigateToApp(): Promise<void> {
    await this.navigateTo('https://demo.guru99.com/insurance/v1/index.php');
  }

  async enterTextOnEmail(value: string): Promise<void> {
    await this.actions.clearAndEnterText(this.locators.email, value);
  }

  async enterTextOnPassword(value: string): Promise<void> {
    await this.actions.clearAndEnterText(this.locators.password, value);
  }

  async clickLogin(): Promise<void> {
    await this.actions.clickOnElement(this.locators.loginButton);
  }

  async clickRequestQuotation(): Promise<void> {
    await this.actions.clickOnElement(this.locators.requestQuotation);
  }

  async selectBreakdowncover(value: string): Promise<void> {
    await this.actions.selectOptionByValueOnDropdown(this.locators.breakdowncover, value);
  }

  async clickSaveQuotation(): Promise<void> {
    await this.actions.clickOnElement(this.locators.saveQuotation);
  }
}
