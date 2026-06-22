import { Page } from '@playwright/test';
import { BasePage } from '../../src/framework/BasePage';
import { CommonActions } from '../../src/framework/CommonActions';
import { BankingApplicationCustomerLocators } from '../locators/BankingApplicationCustomerLocators';

export class BankingApplicationCustomerPage extends BasePage {
  private readonly locators = BankingApplicationCustomerLocators;
  private readonly actions: CommonActions;

  constructor(page: Page) {
    super(page);
    this.actions = new CommonActions(page);
  }

  async navigateToApp(): Promise<void> {
    await this.navigateTo('https://www.globalsqa.com/angularJs-protractor/BankingProject/#/login');
  }

  async clickCustomerLogin(): Promise<void> {
    await this.actions.clickOnElement(this.locators.customerLoginButton);
  }

  async selectUserSelect(value: string): Promise<void> {
    await this.actions.selectOptionByValueOnDropdown(this.locators.userSelect, value);
  }

  async clickLogin(): Promise<void> {
    await this.actions.clickOnElement(this.locators.loginButton);
  }

  async clickDepositTab(): Promise<void> {
    await this.actions.clickOnElement(this.locators.depositTab);
  }

  async enterTextOnAmount(value: string): Promise<void> {
    await this.actions.clearAndEnterText(this.locators.amountInput, value);
  }

  async clickDepositSubmit(): Promise<void> {
    await this.actions.clickOnElement(this.locators.depositSubmitButton);
  }

  async verifyMessageText(value: string): Promise<void> {
    await this.actions.verifyText(this.locators.message, value, 10000);
  }

  async clickWithdrawTab(): Promise<void> {
    await this.actions.clickOnElement(this.locators.withdrawTab);
  }

  async enterTextOnAmountStep10(value: string): Promise<void> {
    await this.actions.clearAndEnterText(this.locators.amountInput, value);
  }

  async clickWithdrawSubmit(): Promise<void> {
    await this.actions.clickOnElement(this.locators.withdrawSubmitButton);
  }

  async verifyMessageTextStep12(value: string): Promise<void> {
    await this.actions.verifyText(this.locators.message, value, 10000);
  }
}
