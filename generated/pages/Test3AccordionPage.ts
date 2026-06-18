import { Page } from '@playwright/test';
import { BasePage } from '../../src/framework/BasePage';
import { CommonActions } from '../../src/framework/CommonActions';
import { Test3AccordionLocators } from '../locators/Test3AccordionLocators';

export class Test3AccordionPage extends BasePage {
  private readonly locators = Test3AccordionLocators;
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
