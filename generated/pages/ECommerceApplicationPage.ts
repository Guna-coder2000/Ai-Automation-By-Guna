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
    await this.actions.clearAndEnterText(this.locators.searchTerms, value);
  }

  async clickSearch(): Promise<void> {
    await this.actions.clickOnElement(this.locators.searchButton);
  }

  async verifyProductItemVisible(): Promise<void> {
    await this.actions.verifyVisible(this.locators.productItem, 10000);
  }

  async clickAddToCart(): Promise<void> {
    await this.actions.clickOnElement(this.locators.addToCartButton);
  }

  async verifyBarNotificationVisi(): Promise<void> {
    await this.actions.verifyVisible(this.locators.barNotification, 10000);
  }

  async clickShoppingCartLink(): Promise<void> {
    await this.actions.clickOnElement(this.locators.shoppingCartLink);
  }

  async clickRemovefromcart(): Promise<void> {
    await this.actions.clickOnElement(this.locators.removefromcart);
  }

  async clickUpdatecart(): Promise<void> {
    await this.actions.clickOnElement(this.locators.updatecart);
  }
}
