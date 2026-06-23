import { Page } from '@playwright/test';
import { BasePage } from '../../src/framework/BasePage';
import { CommonActions } from '../../src/framework/CommonActions';
import { ECommerceApplicationLocators } from '../locators/ECommerceApplicationLocators';

export class ECommerceApplicationPage extends BasePage {
  private readonly locators = ECommerceApplicationLocators;
  private readonly actions: CommonActions;

  constructor(page: Page) {
    super(page);
    this.actions = new CommonActions(page);
  }

  async navigateToApp(): Promise<void> {
    await this.navigateTo('https://demowebshop.tricentis.com/');
  }

  async enterTextOnSearchTerms(value: string): Promise<void> {
    await this.actions.clearAndEnterText(this.locators.searchTermsInput, value);
  }
}
