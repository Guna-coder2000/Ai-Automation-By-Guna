import { Page } from '@playwright/test';
import { BasePage } from '../../src/framework/BasePage';
import { CommonActions } from '../../src/framework/CommonActions';
import { UnnamedScenarioLocators } from '../locators/UnnamedScenarioLocators';

export class UnnamedScenarioPage extends BasePage {
  private readonly locators = UnnamedScenarioLocators;
  private readonly actions: CommonActions;

  constructor(page: Page) {
    super(page);
    this.actions = new CommonActions(page);
  }

  async navigateToApp(): Promise<void> {
    await this.navigateTo('https://the-internet.herokuapp.com/');
  }

  async clickJavascriptAlertsLink(): Promise<void> {
    await this.actions.clickOnElement(this.locators.javascriptAlertsLink);
  }

  async clickJsAlert(): Promise<void> {
    await this.actions.clickOnElement(this.locators.jsAlertButton);
  }

  async navigateToAppStep4(): Promise<void> {
    await this.navigateTo('https://the-internet.herokuapp.com/');
  }

  async clickDynamicControlsLink(): Promise<void> {
    await this.actions.clickOnElement(this.locators.dynamicControlsLink);
  }

  async clickRemoveCheckbox(): Promise<void> {
    await this.actions.clickOnElement(this.locators.removeCheckboxButton);
  }
}
