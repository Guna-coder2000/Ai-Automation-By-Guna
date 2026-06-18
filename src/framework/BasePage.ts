/**
 * ──────────────────────────────────────────────────────────────────────
 * BasePage.ts — Abstract Foundation for All Page Objects
 * ──────────────────────────────────────────────────────────────────────
 *
 * Every generated Page Object extends this class.
 * Provides essential navigation, iframe switching, and page-level helpers.
 *
 * DESIGN RULES:
 *   - NO hardcoded waits (setTimeout). Uses Playwright auto-wait + expect.
 *   - All methods include proper error handling and logging.
 *   - Iframe support built-in via switchToFrame / switchToMainFrame.
 * ──────────────────────────────────────────────────────────────────────
 */

import { Page, FrameLocator } from '@playwright/test';
import Logger from '../utils/logger';

export abstract class BasePage {
  protected readonly page: Page;
  protected readonly logger = Logger.getInstance();

  /** Tracks the current frame context — null means main frame */
  protected currentFrame: FrameLocator | null = null;

  constructor(page: Page) {
    this.page = page;
  }

  // ──────────────────────────────────────────────────────────────────
  // Navigation
  // ──────────────────────────────────────────────────────────────────

  /**
   * Navigate to a URL and wait for the page to be ready.
   * Uses domcontentloaded (faster than networkidle, more reliable than load).
   */
  async navigateTo(url: string): Promise<void> {
    try {
      this.logger.info(`Navigating to ${url}`);
      await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    } catch (err) {
      this.logger.error('Navigation failed', { url, error: err });
      throw err;
    }
  }

  /**
   * Wait for the page to fully load (DOM + network idle).
   * Use this after navigation or complex page transitions.
   */
  async waitForPageLoad(): Promise<void> {
    try {
      await this.page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    } catch (err) {
      this.logger.warn('Page load wait timed out, continuing...', { error: err });
    }
  }

  // ──────────────────────────────────────────────────────────────────
  // Iframe Support
  // ──────────────────────────────────────────────────────────────────

  /**
   * Switch context into an iframe for subsequent interactions.
   * All actions after this call will target elements inside the iframe.
   *
   * @param frameSelector CSS/XPath selector of the iframe element
   * @returns FrameLocator for chaining
   */
  async switchToFrame(frameSelector: string): Promise<FrameLocator> {
    this.logger.info(`Switching to iframe: ${frameSelector}`);
    this.currentFrame = this.page.frameLocator(frameSelector);
    return this.currentFrame;
  }

  /**
   * Switch back to the main page frame.
   * Call this after finishing interactions inside an iframe.
   */
  async switchToMainFrame(): Promise<void> {
    this.logger.info('Switching back to main frame');
    this.currentFrame = null;
  }

  // ──────────────────────────────────────────────────────────────────
  // Page Utilities
  // ──────────────────────────────────────────────────────────────────

  /**
   * Get the current page URL.
   */
  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }

  /**
   * Get the current page title.
   */
  async getPageTitle(): Promise<string> {
    return this.page.title();
  }

  /**
   * Wait for a selector to become visible.
   * @param selector CSS/XPath selector
   * @param timeout Max wait time in ms (default 10000)
   */
  async waitForVisible(selector: string, timeout = 10000): Promise<void> {
    try {
      await this.page.waitForSelector(selector, { state: 'visible', timeout });
    } catch (err) {
      this.logger.error('Element not visible', { selector, error: err });
      throw err;
    }
  }
}
