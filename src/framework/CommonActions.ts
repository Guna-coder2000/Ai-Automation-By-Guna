/**
 * ──────────────────────────────────────────────────────────────────────
 * CommonActions.ts — Universal UI Action Library
 * ──────────────────────────────────────────────────────────────────────
 *
 * This is the SINGLE ACTION LAYER for the entire framework.
 * Every UI interaction (click, fill, select, scroll, iframe, alert,
 * tab management, assertions) is handled here.
 *
 * DESIGN RULES:
 *   - ZERO hardcoded waits. Every action uses Playwright auto-wait + expect.
 *   - EVERY action has error handling with auto-screenshot on failure.
 *   - Actions are IDEMPOTENT — safe to retry after healing.
 *   - Supports: CSS selectors, XPath, Playwright built-in locators.
 * ──────────────────────────────────────────────────────────────────────
 */

import { expect, Page, FrameLocator } from '@playwright/test';
import Logger from '../utils/logger';
import { FrameworkError } from './FrameworkError';

export class CommonActions {
  private readonly page: Page;
  private readonly logger = Logger.getInstance();
  private currentFrameLocator?: FrameLocator;

  switchToFrame(selector: string): void {
    this.logger.info(`Switching context to iframe: ${selector}`);
    this.currentFrameLocator = this.page.frameLocator(selector);
  }

  switchToMainFrame(): void {
    this.logger.info(`Switching context back to main frame`);
    this.currentFrameLocator = undefined;
  }

  private getContext() {
    return this.currentFrameLocator || this.page;
  }

  constructor(page: Page) {
    this.page = page;
  }

  // ──────────────────────────────────────────────────────────────────
  // Click Actions
  // ──────────────────────────────────────────────────────────────────

  /** Click an element after ensuring it is visible and enabled */
  async clickOnElement(selector: string, options?: { timeout?: number }): Promise<void> {
    try {
      this.logger.info(`Clicking element ${selector}`);
      await this.waitForElementClickable(selector, options?.timeout);
      await this.getContext().locator(selector).click(this.withTimeout(options));
    } catch (err) {
      await this.handleError('clickOnElement', selector, err);
    }
  }

  /** Alias for clickElement */
  async click(selector: string, options?: { timeout?: number }): Promise<void> {
    await this.clickOnElement(selector, options);
  }

  /** Double-click an element */
  async doubleClickOnElement(selector: string, options?: { timeout?: number }): Promise<void> {
    try {
      this.logger.info(`Double clicking element ${selector}`);
      await this.waitForElementClickable(selector, options?.timeout);
      await this.getContext().locator(selector).dblclick(this.withTimeout(options));
    } catch (err) {
      await this.handleError('doubleClickOnElement', selector, err);
    }
  }

  /** Right-click an element */
  async rightClickOnElement(selector: string, options?: { timeout?: number }): Promise<void> {
    try {
      this.logger.info(`Right clicking element ${selector}`);
      await this.waitForElementClickable(selector, options?.timeout);
      await this.getContext().locator(selector).click({ ...this.withTimeout(options), button: 'right' });
    } catch (err) {
      await this.handleError('rightClickOnElement', selector, err);
    }
  }

  // ──────────────────────────────────────────────────────────────────
  // Text Input Actions
  // ──────────────────────────────────────────────────────────────────

  /** Enter text into an input field (clears existing text first) */
  async clearAndEnterText(selector: string, value: string, options?: { timeout?: number; clear?: boolean }): Promise<void> {
    try {
      this.logger.info(`Entering text in ${selector}`);
      const actionOptions = this.withTimeout(options);
      const element = this.getContext().locator(selector);
      await this.waitForElementVisible(selector, actionOptions.timeout);
      if (options?.clear !== false) await element.clear(actionOptions);
      await element.fill(value, actionOptions);
    } catch (err) {
      await this.handleError('clearAndEnterText', selector, err);
    }
  }

  /** Clear text from an input field */
  async clearTextOnInput(selector: string, options?: { timeout?: number }): Promise<void> {
    try {
      this.logger.info(`Clearing text in ${selector}`);
      await this.waitForElementVisible(selector, options?.timeout);
      await this.getContext().locator(selector).clear(this.withTimeout(options));
    } catch (err) {
      await this.handleError('clearTextOnInput', selector, err);
    }
  }

  /** Alias for enterText */
  async fill(selector: string, value: string, options?: { timeout?: number }): Promise<void> {
    await this.clearAndEnterText(selector, value, options);
  }

  /** Press a keyboard key on an element */
  async pressKeyOnElement(selector: string, key: string, options?: { timeout?: number }): Promise<void> {
    try {
      this.logger.info(`Pressing ${key} on ${selector}`);
      await this.getContext().locator(selector).press(key, this.withTimeout(options));
    } catch (err) {
      await this.handleError('pressKeyOnElement', selector, err);
    }
  }

  /** Alias for press */
  async pressKey(selector: string, key: string, options?: { timeout?: number }): Promise<void> {
    await this.pressKeyOnElement(selector, key, options);
  }

  // ──────────────────────────────────────────────────────────────────
  // Dropdown & Selection Actions
  // ──────────────────────────────────────────────────────────────────

  /** Select a dropdown option by value (native HTML select) */
  async selectOptionByValueOnDropdown(selector: string, value: string | string[], options?: { timeout?: number }): Promise<void> {
    try {
      this.logger.info(`Selecting dropdown value ${value} on ${selector}`);
      await this.waitForElementVisible(selector, options?.timeout);
      await this.getContext().locator(selector).selectOption(value, this.withTimeout(options));
    } catch (err) {
      await this.handleError('selectOptionByValueOnDropdown', selector, err);
    }
  }

  /** Alias for selectDropdownByValue */
  async select(selector: string, value: string | string[], options?: { timeout?: number }): Promise<void> {
    await this.selectOptionByValueOnDropdown(selector, value, options);
  }

  /** Click a custom dropdown and select an option by visible text */
  async selectOptionByTextOnDropdown(selector: string, value: string, options?: { timeout?: number }): Promise<void> {
    try {
      this.logger.info(`Selecting dropdown text "${value}" from ${selector}`);
      const actionOptions = this.withTimeout(options);
      await this.waitForElementClickable(selector, actionOptions.timeout);
      await this.getContext().locator(selector).click(actionOptions);
      await this.getContext().getByRole('option', { name: value, exact: true }).click(actionOptions);
    } catch (err) {
      await this.handleError('selectOptionByTextOnDropdown', selector, err);
    }
  }

  /** Alias for selectDropdownByText */
  async selectByText(selector: string, value: string, options?: { timeout?: number }): Promise<void> {
    await this.selectOptionByTextOnDropdown(selector, value, options);
  }

  /** Type into an autocomplete field and click the matching option */
  async clearAndEnterTextAndSelectOptionOnDropdown(selector: string, value: string, options?: { timeout?: number }): Promise<void> {
    try {
      this.logger.info(`Entering text in ${selector} and selecting "${value}"`);
      const actionOptions = this.withTimeout(options);
      await this.waitForElementVisible(selector, actionOptions.timeout);
      const element = this.getContext().locator(selector);
      await element.fill(value, actionOptions);
      await this.getContext().getByRole('option', { name: new RegExp(value, 'i') }).first().click(actionOptions);
    } catch (err) {
      await this.handleError('clearAndEnterTextAndSelectOptionOnDropdown', selector, err);
    }
  }

  /** Alias for enterTextAndSelectOption */
  async fillAndChoose(selector: string, value: string, options?: { timeout?: number }): Promise<void> {
    await this.clearAndEnterTextAndSelectOptionOnDropdown(selector, value, options);
  }

  // ──────────────────────────────────────────────────────────────────
  // Checkbox & Radio Actions
  // ──────────────────────────────────────────────────────────────────

  /** Check a checkbox (idempotent — won't fail if already checked) */
  async checkOnCheckboxElement(selector: string, options?: { timeout?: number }): Promise<void> {
    try {
      this.logger.info(`Selecting checkbox ${selector}`);
      await this.waitForElementClickable(selector, options?.timeout);
      await this.getContext().locator(selector).check(this.withTimeout(options));
    } catch (err) {
      await this.handleError('checkOnCheckboxElement', selector, err);
    }
  }

  /** Alias for selectCheckbox */
  async check(selector: string, options?: { timeout?: number }): Promise<void> {
    await this.checkOnCheckboxElement(selector, options);
  }

  /** Uncheck a checkbox */
  async uncheckOnCheckboxElement(selector: string, options?: { timeout?: number }): Promise<void> {
    try {
      this.logger.info(`Unselecting checkbox ${selector}`);
      await this.waitForElementClickable(selector, options?.timeout);
      await this.getContext().locator(selector).uncheck(this.withTimeout(options));
    } catch (err) {
      await this.handleError('uncheckOnCheckboxElement', selector, err);
    }
  }

  /** Alias for unselectCheckbox */
  async uncheck(selector: string, options?: { timeout?: number }): Promise<void> {
    await this.uncheckOnCheckboxElement(selector, options);
  }

  // ──────────────────────────────────────────────────────────────────
  // Mouse & Drag Actions
  // ──────────────────────────────────────────────────────────────────

  /** Hover over an element */
  async hoverOverElementToFocus(selector: string, options?: { timeout?: number }): Promise<void> {
    try {
      this.logger.info(`Hovering over element ${selector}`);
      await this.waitForElementVisible(selector, options?.timeout);
      await this.getContext().locator(selector).hover(this.withTimeout(options));
    } catch (err) {
      await this.handleError('hoverOverElementToFocus', selector, err);
    }
  }

  /** Alias for hoverOverElement */
  async hover(selector: string, options?: { timeout?: number }): Promise<void> {
    await this.hoverOverElementToFocus(selector, options);
  }

  /** Drag one element and drop it onto another */
  async dragAndDropElementToTarget(sourceSelector: string, targetSelector: string, options?: { timeout?: number }): Promise<void> {
    try {
      this.logger.info(`Dragging ${sourceSelector} to ${targetSelector}`);
      await this.getContext().locator(sourceSelector).dragTo(this.getContext().locator(targetSelector), this.withTimeout(options));
    } catch (err) {
      await this.handleError('dragAndDropElementToTarget', `${sourceSelector} -> ${targetSelector}`, err);
    }
  }

  // ──────────────────────────────────────────────────────────────────
  // File Upload
  // ──────────────────────────────────────────────────────────────────

  /** Upload a file to a file input element */
  async uploadFileOnInput(selector: string, filePath: string | string[], options?: { timeout?: number }): Promise<void> {
    try {
      this.logger.info(`Uploading file on ${selector}`);
      await this.page.setInputFiles(selector, filePath, this.withTimeout(options));
    } catch (err) {
      await this.handleError('uploadFileOnInput', selector, err);
    }
  }

  // ──────────────────────────────────────────────────────────────────
  // Scroll Actions
  // ──────────────────────────────────────────────────────────────────

  /** Scroll an element into view before interacting with it */
  async scrollToElement(selector: string, options?: { timeout?: number }): Promise<void> {
    try {
      this.logger.info(`Scrolling to element ${selector}`);
      await this.getContext().locator(selector).scrollIntoViewIfNeeded(this.withTimeout(options));
    } catch (err) {
      await this.handleError('scrollToElement', selector, err);
    }
  }



  // ──────────────────────────────────────────────────────────────────
  // Dialog / Alert Handling
  // ──────────────────────────────────────────────────────────────────

  /** Accept the next browser dialog (alert/confirm/prompt) */
  async acceptAlert(inputText?: string): Promise<void> {
    this.logger.info('Setting up dialog handler: accept');
    this.page.once('dialog', async (dialog) => {
      this.logger.info(`Dialog appeared: "${dialog.message()}". Accepting.`);
      await dialog.accept(inputText);
    });
  }

  /** Dismiss the next browser dialog */
  async dismissAlert(): Promise<void> {
    this.logger.info('Setting up dialog handler: dismiss');
    this.page.once('dialog', async (dialog) => {
      this.logger.info(`Dialog appeared: "${dialog.message()}". Dismissing.`);
      await dialog.dismiss();
    });
  }

  // ──────────────────────────────────────────────────────────────────
  // Tab / Window Management
  // ──────────────────────────────────────────────────────────────────

  /** Wait for a new tab/popup to open and switch to it */
  async switchToNewTab(): Promise<Page> {
    this.logger.info('Waiting for new tab to open...');
    const newPage = await this.page.context().waitForEvent('page', { timeout: 10000 });
    await newPage.waitForLoadState('domcontentloaded');
    this.logger.info(`Switched to new tab: ${newPage.url()}`);
    return newPage;
  }

  /** Close the current page/tab */
  async closeCurrentTab(): Promise<void> {
    this.logger.info('Closing current tab');
    await this.page.close();
  }

  // ──────────────────────────────────────────────────────────────────
  // Element Information Getters
  // ──────────────────────────────────────────────────────────────────

  /** Get the text content of an element */
  async getElementText(selector: string, options?: { timeout?: number }): Promise<string> {
    try {
      await this.waitForElementVisible(selector, options?.timeout);
      const text = await this.getContext().locator(selector).first().innerText(this.withTimeout(options));
      return text.trim();
    } catch (err) {
      await this.handleError('getElementText', selector, err);
      return '';
    }
  }

  /** Count the number of elements matching a selector */
  async getElementCount(selector: string): Promise<number> {
    return this.getContext().locator(selector).count();
  }

  /** Get the value of an input element */
  async getInputValue(selector: string, options?: { timeout?: number }): Promise<string> {
    try {
      await this.waitForElementVisible(selector, options?.timeout);
      return this.getContext().locator(selector).inputValue(this.withTimeout(options));
    } catch (err) {
      await this.handleError('getInputValue', selector, err);
      return '';
    }
  }

  // ──────────────────────────────────────────────────────────────────
  // Screenshot
  // ──────────────────────────────────────────────────────────────────

  /** Take a named screenshot of the current page */
  async takeScreenshot(name: string): Promise<string> {
    const screenshotPath = `reports/screenshots/${name}-${Date.now()}.png`;
    try {
      await this.page.screenshot({ path: screenshotPath, fullPage: true, timeout: 5000 });
      this.logger.info(`Screenshot saved: ${screenshotPath}`);
    } catch (err) {
      this.logger.warn(`Failed to take screenshot: ${err}`);
    }
    return screenshotPath;
  }

  // ──────────────────────────────────────────────────────────────────
  // Network Wait
  // ──────────────────────────────────────────────────────────────────

  /** Wait for all network requests to complete */
  async waitForNetworkIdle(timeout = 3000): Promise<void> {
    try {
      await this.page.waitForLoadState('networkidle', { timeout });
    } catch {
      this.logger.warn('Network idle timeout, continuing...');
    }
  }

  // ──────────────────────────────────────────────────────────────────
  // Advanced Enterprise Logic: Smart Waiting
  // ──────────────────────────────────────────────────────────────────

  /** Wait until DOM mutations completely stop for 500ms */
  async waitForDOMStabilization(timeout = 10000): Promise<void> {
    try {
      this.logger.info('Waiting for DOM to stabilize (0 mutations)...');
      await this.page.evaluate(() => {
        return new Promise((resolve) => {
          let timeoutId: any;
          // @ts-ignore: executed in browser context
          const win = window as any;
          const Observer = win.MutationObserver;
          const observer = new Observer(() => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => { observer.disconnect(); resolve(true); }, 500);
          });
          // @ts-ignore: executed in browser context
          observer.observe(win.document.body, { childList: true, subtree: true, attributes: true });
          timeoutId = setTimeout(() => { observer.disconnect(); resolve(true); }, 500);
        });
      });
    } catch {
      this.logger.warn('DOM stabilization wait timed out.');
    }
  }

  // ──────────────────────────────────────────────────────────────────
  // Advanced Enterprise Logic: Visual Regression
  // ──────────────────────────────────────────────────────────────────

  /** Perform a pixel-perfect visual assertion of the screen or element */
  async verifyVisualMatch(snapshotName: string, selector?: string): Promise<void> {
    try {
      this.logger.info(`Visual verification: ${snapshotName}`);
      if (selector) {
         await expect(this.getContext().locator(selector)).toHaveScreenshot(`${snapshotName}.png`, { maxDiffPixels: 100 });
      } else {
         await expect(this.page).toHaveScreenshot(`${snapshotName}.png`, { maxDiffPixels: 100, fullPage: true });
      }
    } catch (err) {
      await this.handleError('verifyVisualMatch', selector || 'full-page', err);
    }
  }

  // ──────────────────────────────────────────────────────────────────
  // Advanced Enterprise Logic: Soft Assertions
  // ──────────────────────────────────────────────────────────────────

  /** Soft verify element is visible (does not crash test immediately) */
  async verifyVisibleSoft(selector: string, timeout = 3000): Promise<void> {
    this.logger.info(`Soft verifying visibility of: ${selector}`);
    await expect.soft(this.getContext().locator(selector)).toBeVisible({ timeout });
  }

  /** Soft verify text present */
  async verifyTextSoft(selector: string, value: string, timeout = 3000): Promise<void> {
    this.logger.info(`Soft verifying text on: ${selector}`);
    await expect.soft(this.getContext().locator(selector)).toContainText(value, { timeout });
  }

  // ──────────────────────────────────────────────────────────────────
  // Advanced Enterprise Logic: Network Mocking
  // ──────────────────────────────────────────────────────────────────

  /** Instantly mock an API response to bypass broken backends */
  async mockApiResponse(endpointGlob: string, mockData: any, status = 200): Promise<void> {
    this.logger.info(`Mocking API response for: ${endpointGlob}`);
    await this.page.route(endpointGlob, async route => {
      await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(mockData) });
    });
  }

  /** Wait for a specific API endpoint to return successfully */
  async waitForSpecificNetworkResponse(endpointGlob: string, timeout = 10000): Promise<void> {
    this.logger.info(`Waiting for network response: ${endpointGlob}`);
    await this.page.waitForResponse(response => response.url().includes(endpointGlob) && response.status() === 200, { timeout });
  }

  // ──────────────────────────────────────────────────────────────────
  // Assertions & Verification (Auto-Wait, No Hard Waits)
  // ──────────────────────────────────────────────────────────────────

  /** Assert element is visible on the page */
  async waitForElementVisible(selector: string, timeout = 3000): Promise<void> {
    await expect(this.getContext().locator(selector)).toBeVisible({ timeout });
  }

  /** Assert element is visible AND enabled (clickable) */
  async waitForElementClickable(selector: string, timeout = 3000): Promise<void> {
    const element = this.getContext().locator(selector);
    await expect(element).toBeVisible({ timeout });
    await expect(element).toBeEnabled({ timeout });
  }

  /** Assert element contains specific text */
  async waitForTextPresent(selector: string, value: string, timeout = 3000): Promise<void> {
    const matchingElement = this.getContext().locator(selector).filter({ hasText: value }).first();
    await expect(matchingElement).toContainText(value, { timeout });
  }

  /** Wait for all AJAX / network requests to finish */
  async waitForAjaxComplete(timeout = 3000): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout });
  }

  /** Verify element is visible */
  async verifyVisible(selector: string, timeout = 3000): Promise<void> {
    await this.waitForElementVisible(selector, timeout);
  }

  /** Verify element is enabled */
  async verifyEnabled(selector: string, timeout = 3000): Promise<void> {
    await this.waitForElementClickable(selector, timeout);
  }

  /** Verify element is hidden */
  async verifyHidden(selector: string, timeout = 3000): Promise<void> {
    await expect(this.getContext().locator(selector)).toBeHidden({ timeout });
  }

  /** Verify element contains expected text */
  async verifyText(selector: string, value: string, timeout = 3000): Promise<void> {
    await this.waitForTextPresent(selector, value, timeout);
  }

  /** Verify input has expected value */
  async verifyValue(selector: string, value: string, timeout = 3000): Promise<void> {
    await expect(this.getContext().locator(selector)).toHaveValue(value, { timeout });
  }

  // ──────────────────────────────────────────────────────────────────
  // Error Handling — Auto-screenshot on every failure
  // ──────────────────────────────────────────────────────────────────

  private async handleError(action: string, selector: string, err: unknown): Promise<void> {
    const timestamp = Date.now();
    const screenshotPath = `reports/screenshots/${action}-${timestamp}.png`;
    let pageUrl = '';

    try {
      pageUrl = this.page.url();
    } catch { /* page might be closed */ }

    try {
      await this.page.screenshot({ path: screenshotPath, timeout: 3000 });
      this.logger.error(`${action} failed on ${selector}`, { error: err, screenshot: screenshotPath, pageUrl });
    } catch (screenshotErr) {
      this.logger.error(`${action} failed on ${selector}`, { error: err, screenshotError: screenshotErr, pageUrl });
    }

    try {
      const fs = require('fs-extra');
      const path = require('path');
      await fs.ensureDir(path.resolve('test-results'));
      await fs.writeFile(path.resolve('test-results/failed-selector.txt'), selector, 'utf-8');
      let domHtml = await this.page.content();
      
      // 1. Accessibility Tree
      try {
        const a11ySnapshot = await (this.page as any).accessibility.snapshot();
        domHtml += '\n\n<!-- ACCESSIBILITY TREE -->\n' + JSON.stringify(a11ySnapshot, null, 2);
      } catch (e) {
        this.logger.warn(`Failed to capture accessibility snapshot: ${e}`);
      }

      // 2. Frame Tree
      try {
        const frames = this.page.frames().map(f => ({
          name: f.name(),
          url: f.url(),
          parent: f.parentFrame()?.name() || null
        }));
        domHtml += '\n\n<!-- FRAME TREE -->\n' + JSON.stringify(frames, null, 2);
      } catch (e) {
        this.logger.warn(`Failed to capture frame tree: ${e}`);
      }

      // 3. Shadow DOM Tree
      try {
        const shadowDomTree = await this.page.evaluate(() => {
          function getShadowRoots(root: any): any[] {
            let result: any[] = [];
            // @ts-ignore: executed in browser context
            const win = window as any;
            if (!win.document) return result;
            const walker = win.document.createTreeWalker(root, win.NodeFilter.SHOW_ELEMENT, null, false);
            while (walker.nextNode()) {
              const el = walker.currentNode as any;
              if (el.shadowRoot) {
                result.push({ tag: el.tagName, html: el.shadowRoot.innerHTML });
                result = result.concat(getShadowRoots(el.shadowRoot));
              }
            }
            return result;
          }
          // @ts-ignore: executed in browser context
          return getShadowRoots((window as any).document.body);
        });
        domHtml += '\n\n<!-- SHADOW DOM TREE -->\n' + JSON.stringify(shadowDomTree, null, 2);
      } catch (e) {
        this.logger.warn(`Failed to capture shadow DOM tree: ${e}`);
      }

      // 4. Specific Iframe Content (if applicable)
      if (this.currentFrameLocator) {
         try {
           const frameHtml = await this.currentFrameLocator.locator(':root').innerHTML();
           domHtml += '\n\n<!-- IFRAME CONTENT -->\n' + frameHtml;
         } catch {}
      }
      
      await fs.writeFile(path.resolve('test-results/error-context.md'), domHtml);
    } catch {}

    throw new FrameworkError(
      `${action} failed on ${selector}`,
      err as Error,
      'LOCATOR_FAIL',
      { pageUrl, screenshot: screenshotPath }
    );
  }

  /** Apply default timeout to action options */
  private withTimeout<T extends { timeout?: number }>(options?: T): T {
    return { timeout: 30000, ...(options ?? {}) } as T;
  }
}
