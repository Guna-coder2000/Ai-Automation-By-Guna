/**
 * ──────────────────────────────────────────────────────────────────────
 * ExecutionAgent.ts — Test Runner & Error Context Gatherer
 * ──────────────────────────────────────────────────────────────────────
 *
 * Runs the generated Playwright spec file.
 * Automatically captures stdout/stderr, screenshots, videos, and logs.
 * On failure, it extracts the exact failed locator, page URL, and DOM
 * snippet to feed into the Healing Agent.
 * ──────────────────────────────────────────────────────────────────────
 */

import { spawn } from 'child_process';
import path from 'path';
import { readFile } from 'fs-extra';
import Logger from '../../utils/logger';
import { FrameworkError } from '../../framework/FrameworkError';
import { executionLog } from '../../utils/console-ui';

export class ExecutionAgent {
  private readonly logger = Logger.getInstance();

  async run(specPath: string): Promise<{ passed: boolean; output: string }> {
    const absolutePath = path.resolve(specPath);
    const relativePath = path.relative(process.cwd(), absolutePath).split(path.sep).join('/');
    this.logger.info(`ExecutionAgent: running spec ${absolutePath}`);
    executionLog('info', 'Execution started', `Spec: ${relativePath}`);

    return new Promise((resolve, reject) => {
      const project = process.env.PLAYWRIGHT_PROJECT || 'chrome';
      let modeFlag = '';
      if (process.env.PLAYWRIGHT_UI === 'true') {
        modeFlag = ' --ui';
      } else if (process.env.HEADLESS !== 'true' && !process.env.CI) {
        modeFlag = ' --headed';
      }

      const cmd = `npx playwright test "${relativePath}" --project=${project}${modeFlag}`;
      executionLog('action', 'Opening browser', `Project: ${project}${modeFlag ? `, mode:${modeFlag.trim()}` : ''}`);

      let stdout = '';
      let stderr = '';
      let timedOut = false;

      const timeoutMs = parseInt(process.env.EXECUTION_TIMEOUT || '300000', 10);
      const child = spawn(cmd, { cwd: process.cwd(), shell: true, env: process.env });
      
      const timeout = setTimeout(() => {
        timedOut = true;
        child.kill();
      }, timeoutMs);

      child.stdout?.on('data', (data: Buffer) => {
        const chunk = data.toString();
        stdout += chunk;
        if (chunk.trim()) this.logger.debug(chunk.trimEnd());
      });

      child.stderr?.on('data', (data: Buffer) => {
        const chunk = data.toString();
        stderr += chunk;
        if (chunk.trim()) this.logger.debug(chunk.trimEnd());
      });

      child.on('error', (error) => {
        clearTimeout(timeout);
        const frameworkError = new FrameworkError('Execution process failed to start', error, 'EXEC_START_FAIL');
        executionLog('error', 'Execution failed', 'Playwright process could not start');
        reject(frameworkError);
      });

      child.on('close', async (code) => {
        clearTimeout(timeout);

        if (code !== 0 || timedOut) {
          const output = `${stdout}\n${stderr}`;
          const failedSelector = this.extractFailedSelector(output);
          const failure = this.classifyFailure(output, failedSelector, timedOut);
          
          this.logger.error('Playwright execution failed', { exitCode: code, reason: failure.reason });
          
          if (failedSelector) {
            this.logger.warn(`ExecutionAgent: detected failed selector "${failedSelector}"`);
            executionLog('heal', 'Healing candidate detected', failedSelector);
          } else {
            executionLog('skip', 'Healing skipped', failure.reason);
          }

          // Read the auto-saved DOM snippet if it exists
          let domSnippet = '';
          try {
             domSnippet = await readFile(path.resolve('test-results/error-context.md'), 'utf-8');
          } catch {
             // File might not exist
          }

          const originalError = new Error(timedOut ? `Playwright execution timed out after ${timeoutMs}ms` : `Playwright exited with code ${code}`);
          const frameworkError = new FrameworkError('Execution failed', originalError, 'EXEC_FAIL', { domSnippet }) as FrameworkError & {
            output?: string;
            failedSelector?: string;
            failureKind?: string;
            healingReason?: string;
            domSnippet?: string;
          };
          
          frameworkError.output = output;
          frameworkError.failedSelector = failedSelector;
          frameworkError.failureKind = failure.kind;
          frameworkError.healingReason = failure.reason;
          frameworkError.domSnippet = domSnippet;
          reject(frameworkError);
        } else {
          this.logger.info('Playwright execution passed');
          executionLog('success', 'Execution passed', 'All browser steps completed');
          resolve({ passed: true, output: stdout });
        }
      });
    });
  }

  private extractFailedSelector(output: string): string | undefined {
    try {
      const fs = require('fs');
      const path = require('path');
      const selectorFile = path.resolve('test-results/failed-selector.txt');
      if (fs.existsSync(selectorFile)) {
        return fs.readFileSync(selectorFile, 'utf-8').trim();
      }
    } catch {}

    // Fallback: Playwright error logs usually contain locator('...') or getBy...
    const waitingForLocatorMatch = output.match(/waiting for locator\((.+?)\)/i);
    if (waitingForLocatorMatch?.[1]) return this.cleanExtractedSelector(waitingForLocatorMatch[1]);

    const locatorLineMatch = output.match(/Locator:\s+locator\((.+?)\)\s*$/im);
    if (locatorLineMatch?.[1]) return this.cleanExtractedSelector(locatorLineMatch[1]);

    const frameLocatorMatch = output.match(/frameLocator\((.+?)\)/i);
    if (frameLocatorMatch?.[1]) return this.cleanExtractedSelector(frameLocatorMatch[1]);

    const frameworkActionMatch = output.match(/(?:FrameworkError:\s*)?(?:clickOnElement|clearAndEnterText|selectOptionByTextOnDropdown|verifyElementVisible|verifyElementHidden|click|fill|press|select|selectByText|fillAndChoose|check|uncheck|hover|dragAndDrop|uploadFile)\s+failed on\s+([^\r\n]+)/i);
    if (frameworkActionMatch?.[1]) return this.cleanExtractedSelector(frameworkActionMatch[1]);

    const waitingForMatch = output.match(/waiting for (?:locator\()?['"`]([^'"`\n]+)['"`]\)?/i);
    if (waitingForMatch?.[1]) return this.cleanExtractedSelector(waitingForMatch[1]);

    if (/ReferenceError|TypeError: Duplicate declaration|No tests found/i.test(output)) {
      return undefined;
    }

    return undefined;
  }

  private cleanExtractedSelector(selector: string): string {
    const trimmed = selector.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '').split(/\s+\{"(?:error|screenshot|screenshotError)"/)[0].trim();
    const unwrapped = /^(['"`])[\s\S]*\1$/.test(trimmed)
      ? trimmed.slice(1, -1)
      : trimmed;

    return unwrapped
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
      .trim();
  }

  private classifyFailure(output: string, failedSelector: string | undefined, timedOut: boolean): { kind: string; reason: string } {
    if (failedSelector) {
      return { kind: 'locator', reason: `Locator failed: ${failedSelector}` };
    }

    if (timedOut) {
      return { kind: 'timeout', reason: 'Execution timed out before a failed selector was detected' };
    }

    if (/page\.goto:\s*url:\s*expected string,\s*got undefined/i.test(output)) {
      return { kind: 'navigation', reason: 'Navigation URL is missing' };
    }

    if (/ReferenceError|TypeError: Duplicate declaration|No tests found/i.test(output)) {
      return { kind: 'code', reason: 'Generated test code failed before a locator action' };
    }

    if (/SyntaxError/i.test(output) && /locator\(/i.test(output)) {
      return { kind: 'locator', reason: 'Invalid locator syntax detected' };
    }

    if (/browserType\.launch|Executable doesn't exist|Target page, context or browser has been closed/i.test(output)) {
      return { kind: 'browser', reason: 'Browser/runtime failed before a locator failure was detected' };
    }

    if (/expect\(|toBeVisible|toHaveText|toContainText|toBeEnabled/i.test(output)) {
      return { kind: 'assertion', reason: 'Assertion failed without a concrete selector value for healing' };
    }

    return { kind: 'unknown', reason: 'No failed selector was detected in Playwright output' };
  }
}
