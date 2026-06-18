/**
 * ──────────────────────────────────────────────────────────────────────
 * FrameworkError.ts — Classified Error System
 * ──────────────────────────────────────────────────────────────────────
 *
 * Every error in the framework is wrapped in a FrameworkError with:
 *   - A classification code (LOCATOR_FAIL, NAVIGATION_FAIL, etc.)
 *   - The original error for stack trace preservation
 *   - Optional page URL and DOM snippet for debugging
 *
 * This allows the Healing Agent and Reporting Agent to understand
 * WHY a test failed and take the correct corrective action.
 * ──────────────────────────────────────────────────────────────────────
 */

/** Error classification codes used across the framework */
export type ErrorCode =
  | 'FRAMEWORK_ERROR'
  | 'LOCATOR_FAIL'
  | 'NAVIGATION_FAIL'
  | 'ASSERTION_FAIL'
  | 'TIMEOUT_FAIL'
  | 'IFRAME_FAIL'
  | 'API_FAIL'
  | 'EXEC_FAIL'
  | 'EXEC_START_FAIL'
  | 'API_GEN_FAIL'
  | 'GEN_EMPTY'
  | 'GEN_INVALID'
  | 'HEAL_FAIL'
  | 'HEAL_EMPTY'
  | 'HEAL_INVALID_SELECTOR'
  | 'HEAL_SELECTOR_NOT_FOUND'
  | 'REPORT_FAIL'
  | 'CONFIG_FAIL'
  | 'LLM_FAIL';

export class FrameworkError extends Error {
  /** Classification code identifying the type of failure */
  public readonly code: ErrorCode;

  /** The original error that caused this framework error */
  public readonly originalError?: Error;

  /** URL of the page when the error occurred (captured automatically) */
  public readonly pageUrl?: string;

  /** Path to auto-captured screenshot at time of failure */
  public readonly screenshot?: string;

  /** Relevant DOM context around the failure point */
  public readonly domSnippet?: string;

  constructor(
    message: string,
    originalError?: Error,
    code: ErrorCode = 'FRAMEWORK_ERROR',
    context?: {
      pageUrl?: string;
      screenshot?: string;
      domSnippet?: string;
    }
  ) {
    super(message);
    this.name = 'FrameworkError';
    this.code = code;
    this.originalError = originalError;
    this.pageUrl = context?.pageUrl;
    this.screenshot = context?.screenshot;
    this.domSnippet = context?.domSnippet;

    // Preserve proper stack trace (only works in V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FrameworkError);
    }
  }

  /**
   * Create a detailed error description for logging and reporting.
   * Includes all available context: URL, classification, DOM snippet.
   */
  toDetailedString(): string {
    const parts = [
      `[${this.code}] ${this.message}`,
    ];
    if (this.pageUrl) parts.push(`  Page URL: ${this.pageUrl}`);
    if (this.screenshot) parts.push(`  Screenshot: ${this.screenshot}`);
    if (this.domSnippet) parts.push(`  DOM Context: ${this.domSnippet.slice(0, 300)}`);
    if (this.originalError) parts.push(`  Caused by: ${this.originalError.message}`);
    return parts.join('\n');
  }
}
