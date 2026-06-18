import { Page } from '@playwright/test';
import { BasePage } from '../../src/framework/BasePage';
import { CommonActions } from '../../src/framework/CommonActions';
import { Test5IframeLocators } from '../locators/Test5IframeLocators';

export class Test5IframePage extends BasePage {
  private readonly locators = Test5IframeLocators;
  private readonly actions: CommonActions;

  constructor(page: Page) {
    super(page);
    this.actions = new CommonActions(page);
  }

  async navigateToApplication(): Promise<void> {
    await this.navigateTo(this.locators.applicationUrl);
  }

  async verifyVisibleVisible(): Promise<void> {
    await this.actions.verifyVisible(this.locators.page, 10000);
  }
}
