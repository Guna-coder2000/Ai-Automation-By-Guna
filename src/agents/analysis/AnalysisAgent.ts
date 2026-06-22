import { readFile } from 'fs-extra';
import path from 'path';
import Logger from '../../utils/logger';
import { LLMProviderFactory } from '../../framework/LLMProvider';
import { FrameworkError } from '../../framework/FrameworkError';

/**
 * ──────────────────────────────────────────────────────────────────────
 * AnalysisAgent - AI Root Cause Analyzer
 * ──────────────────────────────────────────────────────────────────────
 * RESPONSIBILITY:
 * This agent acts as a diagnostic engineer. When a test fails for reasons 
 * OTHER than a locator (e.g., Node.js crash, Network timeout, API 500 error),
 * it reads the Playwright logs and Network traces.
 * 
 * CORE FEATURES:
 * - Uses LLM to translate cryptic stack traces into plain English summaries.
 * - Injects framework logs natively into prompts.
 * ──────────────────────────────────────────────────────────────────────
 */
export class AnalysisAgent {
  private readonly logger = Logger.getInstance();
  private readonly promptPath = path.resolve('prompts', 'analysis.txt');

  async run(errorOutput: string): Promise<string> {
    try {
      this.logger.info('AnalysisAgent: analyzing non-locator failure...');
      
      let frameworkLogs = '';
      try {
         const logPath = path.resolve('reports', 'logs', 'framework.log');
         frameworkLogs = await readFile(logPath, 'utf-8');
      } catch {}

      try {
        const provider = LLMProviderFactory.getProvider();
        const template = await readFile(this.promptPath, 'utf-8');
        const prompt = template
          .replace('{{ERROR_LOGS}}', errorOutput.slice(-2000))
          .replace('{{FRAMEWORK_LOGS}}', frameworkLogs.slice(-2000));

        const analysis = await provider.generate(prompt);
        this.logger.info(`AnalysisAgent: Root cause analysis generated via AI.`);
        return analysis.trim();
      } catch (llmErr) {
        this.logger.warn('AnalysisAgent: LLM generation failed, using local offline diagnostic heuristic', { error: llmErr });
        return this.analyzeOffline(errorOutput);
      }
    } catch (err) {
      this.logger.error('AnalysisAgent failed', { error: err });
      return 'Analysis failed. Could not determine root cause from logs.';
    }
  }

  private analyzeOffline(errorOutput: string): string {
    if (/strict mode violation/i.test(errorOutput) || /resolved to \d+ elements/i.test(errorOutput)) {
      return "Logic Error (Strict Mode Violation): The generated locator matches multiple elements on the page. The logic must be updated to be more specific.";
    }
    if (/status 5\d\d|internal server error/i.test(errorOutput)) {
      return "Infrastructure Error (HTTP 500): The server returned an Internal Server Error during the test. The backend environment may be down or crashing.";
    }
    if (/status 4\d\d|unauthorized|forbidden|bad request/i.test(errorOutput)) {
      return "Logic Error (HTTP 400+): The application returned a client error. The test might be using invalid auth tokens, missing headers, or sending bad payloads.";
    }
    if (/ERR_CONNECTION_REFUSED|ERR_NAME_NOT_RESOLVED/i.test(errorOutput)) {
      return "Infrastructure Error (Network): The browser failed to navigate to the application URL. The application might be down or inaccessible from this network.";
    }
    if (/Test timeout of \d+ms exceeded/i.test(errorOutput)) {
      return "Infrastructure/Logic Error (Timeout): The test exceeded the maximum allowed execution time before completing. The application might be responding too slowly or a background process hung.";
    }
    if (/Target page, context or browser has been closed/i.test(errorOutput)) {
      return "Infrastructure Error (Crash): The Playwright browser context was unexpectedly closed during execution. This usually indicates a fatal browser crash or an external process killing the browser.";
    }
    if (/SyntaxError|ReferenceError/i.test(errorOutput)) {
      return "Logic Error (Syntax): There is a fatal TypeScript syntax or reference error in the generated test code or page object. Requires code fix.";
    }
    if (/expect\(.*?\)\.toHaveURL/i.test(errorOutput) || /expect\(.*?\)\.toBeVisible/i.test(errorOutput) || /expected .* to be visible/i.test(errorOutput)) {
      return "Logic Error (Assertion): A logic or flow assertion failed. Expected element or URL was not reached. Logic issue.";
    }
    return "Unknown Error: The execution crashed for an undefined reason not related to locators. Manual log inspection required.";
  }
}
