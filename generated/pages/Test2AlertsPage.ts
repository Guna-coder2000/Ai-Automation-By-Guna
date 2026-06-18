import { Page } from '@playwright/test';
import { BasePage } from '../../src/framework/BasePage';
import { CommonActions } from '../../src/framework/CommonActions';
import { Test2AlertsLocators } from '../locators/Test2AlertsLocators';

export class Test2AlertsPage extends BasePage {
  private readonly locators = Test2AlertsLocators;
  private readonly actions: CommonActions;

  constructor(page: Page) {
    super(page);
    this.actions = new CommonActions(page);
  }

  async navigateToApplication(): Promise<void> {
    await this.navigateTo(this.locators.applicationUrl);
  }

  async enterTextOnPromptTextInput(value: string): Promise<void> {
    await this.actions.clearAndEnterText(this.locators.promptText, value);
  }

  async verifyVisibleVisible(): Promise<void> {
    await this.actions.verifyVisible(this.locators.page, 10000);
  }
}
