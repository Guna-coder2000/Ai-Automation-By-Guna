/**
 * ──────────────────────────────────────────────────────────────────────
 * WaitHelpers.ts — Smart Wait Utilities (Zero Hard Waits)
 * ──────────────────────────────────────────────────────────────────────
 *
 * Provides intelligent waiting strategies using Playwright's built-in
 * auto-wait and expect assertions. NEVER uses setTimeout for waiting.
 *
 * Available helpers:
 *   - retryAsync: Retry any async function with exponential backoff
 *   - waitForSelector: Wait for element visibility
 *   - waitForUrlChange: Wait for URL to match a pattern
 *   - waitForElementCount: Wait for exact number of elements
 *   - waitForTextChange: Wait for text to change from old value
 *   - waitForElementRemoved: Wait for element to disappear
 * ──────────────────────────────────────────────────────────────────────
 */

import { expect, Page } from '@playwright/test';

export class WaitHelpers {

  /**
   * Retry an async function multiple times with exponential back-off.
   * Useful for operations that may fail due to timing or network issues.
   *
   * @param fn The async function to retry
   * @param attempts Number of attempts (default 3)
   * @param delayMs Initial delay in ms (default 500)
   */
  static async retryAsync<T>(fn: () => Promise<T>, attempts = 3, delayMs = 500): Promise<T> {
    let attempt = 0;
    let lastError: any;
    while (attempt < attempts) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        attempt++;
        if (attempt < attempts) {
          const backoff = delayMs * Math.pow(2, attempt - 1);
          await new Promise(res => setTimeout(res, backoff));
        }
      }
    }
    throw lastError;
  }

  /**
   * Wait for a selector to become visible using Playwright's built-in method.
   */
  static async waitForSelector(page: Page, selector: string, timeout = 5000): Promise<void> {
    await page.waitForSelector(selector, { state: 'visible', timeout });
  }

  /**
   * Wait for the page URL to match a specific pattern.
   * Uses Playwright's expect assertion with auto-retry — no polling loops.
   *
   * @param page Playwright page
   * @param urlPattern String or RegExp to match against the URL
   * @param timeout Max wait time (default 15000ms)
   */
  static async waitForUrlChange(page: Page, urlPattern: string | RegExp, timeout = 15000): Promise<void> {
    await expect(page).toHaveURL(urlPattern, { timeout });
  }

  /**
   * Wait until the number of elements matching a selector equals the expected count.
   * Uses Playwright's expect assertion — auto-retries until condition is met.
   *
   * @param page Playwright page
   * @param selector CSS/XPath selector
   * @param expectedCount Expected number of matching elements
   * @param timeout Max wait time (default 10000ms)
   */
  static async waitForElementCount(page: Page, selector: string, expectedCount: number, timeout = 10000): Promise<void> {
    await expect(page.locator(selector)).toHaveCount(expectedCount, { timeout });
  }

  /**
   * Wait for the text of an element to change from its current value.
   * Useful for dynamic content that updates after an action.
   *
   * @param page Playwright page
   * @param selector CSS/XPath selector
   * @param oldText The text that should no longer be present
   * @param timeout Max wait time (default 10000ms)
   */
  static async waitForTextChange(page: Page, selector: string, oldText: string, timeout = 10000): Promise<void> {
    await expect(page.locator(selector).first()).not.toHaveText(oldText, { timeout });
  }

  /**
   * Wait for an element to be removed from the DOM (hidden or detached).
   * Useful after delete operations or modal dismissals.
   *
   * @param page Playwright page
   * @param selector CSS/XPath selector
   * @param timeout Max wait time (default 10000ms)
   */
  static async waitForElementRemoved(page: Page, selector: string, timeout = 10000): Promise<void> {
    await expect(page.locator(selector)).toBeHidden({ timeout });
  }
}
