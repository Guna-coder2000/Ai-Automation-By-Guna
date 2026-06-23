import { Page } from '@playwright/test';
import { BasePage } from '../../src/framework/BasePage';
import { CommonActions } from '../../src/framework/CommonActions';
import { ValidateAuthenticationFlowLocators } from '../locators/ValidateAuthenticationFlowLocators';

export class ValidateAuthenticationFlowPage extends BasePage {
  private readonly locators = ValidateAuthenticationFlowLocators;
  private readonly actions: CommonActions;

  constructor(page: Page) {
    super(page);
    this.actions = new CommonActions(page);
  }

  async navigateToApp(): Promise<void> {
    await this.navigateTo('https://www.saucedemo.com/');
  }

  async enterTextOnUsername(value: string): Promise<void> {
    await this.actions.clearAndEnterText(this.locators.usernameInput, value);
  }

  async enterTextOnPassword(value: string): Promise<void> {
    await this.actions.clearAndEnterText(this.locators.passwordInput, value);
  }
}
