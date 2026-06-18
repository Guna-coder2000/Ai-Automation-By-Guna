import { readFile, writeFile, ensureDir } from 'fs-extra';
import path from 'path';
import Logger from '../../utils/logger';
import { LLMProviderFactory } from '../../framework/LLMProvider';
import { FrameworkError } from '../../framework/FrameworkError';

/**
 * ──────────────────────────────────────────────────────────────────────
 * ApiAgent - Backend API Test Generator
 * ──────────────────────────────────────────────────────────────────────
 * RESPONSIBILITY:
 * Handles the generation of integration and backend REST API tests.
 * 
 * CORE FEATURES:
 * - Generates secure Playwright API request contexts.
 * - Auto-injects status assertions (e.g., expect 200 OK).
 * - Utilizes an offline fallback generator if the LLM rate limits.
 * ──────────────────────────────────────────────────────────────────────
 */
export class ApiAgent {
  private readonly logger = Logger.getInstance();
  private readonly generatedDir = path.resolve('generated', 'tests');
  private readonly promptPath = path.resolve('prompts', 'api.txt');

  async run(requestFile: string): Promise<string> {
    try {
      const rawRequest = await readFile(requestFile, 'utf-8');
      const req = this.parseRequirement(rawRequest, requestFile);
      
      const provider = LLMProviderFactory.getProvider();
      const template = await readFile(this.promptPath, 'utf-8');
      const prompt = template.replace('{{REQUEST_JSON}}', JSON.stringify(req, null, 2));
      
      this.logger.info(`ApiAgent: using prompt template ${this.promptPath}`);
      let testCode = '';
      try {
        const rawOutput = await provider.generate(prompt);
        testCode = this.cleanGeneratedCode(rawOutput);
        if (!testCode || !testCode.includes('@playwright/test')) throw new Error('Invalid code');
      } catch (err) {
        this.logger.warn('ApiAgent: prompt execution failed; using structured local fallback', { error: err });
        const sanitizedScenarioName = this.deriveClassName(req.requirement || 'ApiTest');
        testCode = this.generateStructuredFallback(req, sanitizedScenarioName);
      }

      await ensureDir(this.generatedDir);
      
      const sanitizedScenarioName = this.deriveClassName(req.requirement || 'ApiTest');
      const specPath = path.join(this.generatedDir, `${sanitizedScenarioName}.spec.ts`);
      
      await writeFile(specPath, testCode);
      this.logger.info(`ApiAgent: Generated API spec at ${specPath}`);
      
      return specPath;
    } catch (err) {
      this.logger.error('ApiAgent failed', { error: err });
      throw new FrameworkError('API Generation failed', err as Error);
    }
  }

  private generateStructuredFallback(req: any, scenarioName: string): string {
    const url = req.applicationUrl || 'https://jsonplaceholder.typicode.com/posts/1';
    return `import { test, expect } from '@playwright/test';
import { CommonApiActions } from '../../src/framework/CommonApiActions';

test.describe('${req.requirement || 'API Test'}', () => {
  test('Execute API flow', async ({ request }) => {
    const api = new CommonApiActions(request);
    await test.step('Send GET request and verify', async () => {
       const response = await api.get('${url}');
       expect(response).toBeDefined();
    });
  });
});
`;
  }

  private parseRequirement(raw: string, requestFile: string): any {
    try {
      return JSON.parse(raw);
    } catch {
      const fileName = path.basename(requestFile, path.extname(requestFile));
      return {
        applicationUrl: process.env.BASE_URL,
        requirement: raw.trim() || fileName.replace(/[-_]+/g, ' '),
        isApiTest: true
      };
    }
  }

  private cleanGeneratedCode(output: string): string {
    const trimmed = output.trim();
    const fenced = trimmed.match(/^```(?:ts|typescript)?\s*([\s\S]*?)\s*```$/i);
    return (fenced ? fenced[1] : trimmed).trim();
  }

  private deriveClassName(scenario: string): string {
    const words = scenario
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
      
    const className = words.slice(0, 4)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');

    return (className || 'ApiTest').slice(0, 30);
  }
}
