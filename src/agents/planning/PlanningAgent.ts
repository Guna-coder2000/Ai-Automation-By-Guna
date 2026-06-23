import { readFile, writeFile, ensureDir } from 'fs-extra';
import path from 'path';
import Logger from '../../utils/logger';
import { LLMProviderFactory } from '../../framework/LLMProvider';
import { FrameworkError } from '../../framework/FrameworkError';

/**
 * ──────────────────────────────────────────────────────────────────────
 * PlanningAgent - Workflow Orchestration Layer
 * ──────────────────────────────────────────────────────────────────────
 * RESPONSIBILITY:
 * This agent acts as the 'Architect' of the framework. It reads the raw
 * user JSON requests and uses LLM (or offline logic) to translate plain
 * English requirements into a strict, atomic JSON array of actionable steps.
 * 
 * CORE FEATURES:
 * - Normalizes user locators and test data.
 * - Extracts environment configurations.
 * - Auto-injects iframe boundaries and login pre-requisites.
 * ──────────────────────────────────────────────────────────────────────
 */
export class PlanningAgent {
  private readonly logger = Logger.getInstance();
  private readonly storageDir = path.resolve('storage', 'plans');
  private readonly promptPath = path.resolve('prompts', 'planning.txt');
  private readonly replanPromptPath = path.resolve('prompts', 'replanning.txt');

  async run(requestFile: string): Promise<string> {
    try {
      const raw = await readFile(requestFile, 'utf-8');
      const req = this.parseRequirement(raw, requestFile);
      const normalizedReq = {
        ...req,
        locators: this.normalizeLocatorAliases(req.locators),
      };
      const steps = await this.createSteps(JSON.stringify(normalizedReq, null, 2), normalizedReq);
      const plan: Record<string, any> = {
        scenario: normalizedReq.scenario ?? normalizedReq.requirement ?? 'UnnamedScenario',
        steps,
        env: normalizedReq.environment ?? 'default',
        applicationUrl: normalizedReq.applicationUrl ?? process.env.BASE_URL,
      };
      // Carry locators and testData through so GenerateAgent can use them directly
      if (Object.keys(normalizedReq.locators).length > 0) {
        plan.locators = normalizedReq.locators;
      }
      if (normalizedReq.testData && typeof normalizedReq.testData === 'object') {
        plan.testData = normalizedReq.testData;
      }
      return this.writePlan(plan);
    } catch (err) {
      this.logger.error('PlanningAgent failed', { error: err });
      throw new FrameworkError('Planning failed', err as Error);
    }
  }

  private async writePlan(plan: Record<string, any>): Promise<string> {
    await ensureDir(this.storageDir);
    const planPath = path.join(this.storageDir, `${this.safeFileBase(plan.scenario)}Plan.json`);
    await writeFile(planPath, JSON.stringify(plan, null, 2));
    this.logger.info(`Plan written to ${planPath}`);
    return planPath;
  }

  async replan(errorOutput: string, domSnapshot?: string, originalPlanPath?: string): Promise<string> {
    try {
      this.logger.info('PlanningAgent: Initiating dynamic replanning based on execution failure');
      
      let originalPlan = {};
      if (originalPlanPath) {
        try {
          originalPlan = JSON.parse(await readFile(originalPlanPath, 'utf-8'));
        } catch {
          this.logger.warn(`PlanningAgent: Could not read original plan at ${originalPlanPath}`);
        }
      }

      const provider = LLMProviderFactory.getProvider();
      let prompt = `You are an AI Test Planner. A test execution failed due to a missing step or logic error.
Error:
${errorOutput.slice(-1000)}

Original Plan:
${JSON.stringify(originalPlan, null, 2)}`;

      if (domSnapshot) {
        prompt += `\n\nCurrent DOM Snapshot (UI State):
${domSnapshot.slice(0, 3000)}`;
      }

      prompt += `\n\nPlease output ONLY a valid JSON array of updated steps that fixes the issue. If the login flow changed, update it. If there's a popup, add a step to close it. Use action types: navigate, click, fill, assertVisible, etc.`;

      let rawOutput = '';
      try {
        rawOutput = await provider.generate(prompt);
      } catch (err) {
        this.logger.warn('PlanningAgent: replan LLM call failed, falling back to original plan', { error: err });
        return originalPlanPath ?? '';
      }

      const newSteps = this.parseSteps(rawOutput);
      if (!newSteps || newSteps.length === 0) {
        this.logger.warn('PlanningAgent: Could not parse new steps from LLM. Aborting replan.');
        return originalPlanPath ?? '';
      }

      const newPlan = {
        ...originalPlan,
        steps: newSteps
      };

      return await this.writePlan(newPlan);
    } catch (err) {
      this.logger.error('PlanningAgent replan failed', { error: err });
      return originalPlanPath ?? '';
    }
  }

  private safeFileBase(value: string): string {
    const testMatch = value.match(/^(Test\d+[a-zA-Z0-9_]*)/i);
    if (testMatch) {
      return testMatch[1];
    }

    const words = String(value || 'UnnamedScenario')
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
      .replace(/[^a-zA-Z0-9]+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const stopWords = new Set(['verification', 'verify', 'navigate', 'site', 'valid', 'credentials', 'shown', 'after', 'with', 'the', 'and', 'then', 'in', 'on']);
    const significant = words.filter((word) => !stopWords.has(word.toLowerCase()));
    const className = significant.slice(0, 3)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');

    return className || 'GeneratedTest';
  }

  private parseRequirement(raw: string, requestFile: string): any {
    try {
      return JSON.parse(raw);
    } catch {
      const fileName = path.basename(requestFile, path.extname(requestFile));
      this.logger.warn(`Requirement file is not JSON; treating ${requestFile} as plain-text requirement`);
      return {
        applicationUrl: process.env.BASE_URL,
        environment: process.env.ENVIRONMENT ?? 'default',
        requirement: raw.trim() || fileName.replace(/[-_]+/g, ' '),
        testData: {},
      };
    }
  }

  private async createSteps(rawRequest: string, req: any): Promise<any[]> {
    let domSnapshot = '';
    try {
      const template = await readFile(this.promptPath, 'utf-8');
      const existingTests = await this.scanForExistingTests();
      const prerequisitesContext = existingTests.length > 0 
        ? `\n\nAVAILABLE PREREQUISITES (Use 'executePrerequisite' action to call these instead of recreating their steps):\n${existingTests.join(', ')}`
        : '';

      let domContext = '';
      if (!req.locators || Object.keys(req.locators).length === 0) {
        this.logger.info('PlanningAgent: No locators provided. Initiating Real DOM Discovery...');
        const { DiscoveryAgent } = await import('../discovery/DiscoveryAgent');
        const discovery = new DiscoveryAgent();
        const url = req.applicationUrl ?? process.env.BASE_URL;
        if (url) {
          domSnapshot = await discovery.discoverDOM(url);
          if (domSnapshot) {
             domContext = `\n\nREAL APPLICATION DOM SNAPSHOT:\n${domSnapshot}\n\nUse this DOM to generate exact, highly accurate XPaths for your steps.`;
          }
        }
      }

      const prompt = template.replace('{{REQUEST_JSON}}', rawRequest + prerequisitesContext + domContext);
      this.logger.info(`PlanningAgent: using prompt template ${this.promptPath} with ${existingTests.length} prerequisites available`);
      const output = await LLMProviderFactory.getProvider().generate(prompt);
      const steps = this.parseSteps(output);

      if (steps.length) {
        this.logger.info(`PlanningAgent: accepted prompt output with ${steps.length} steps`);
        return steps;
      }

      this.logger.warn('PlanningAgent: prompt output was empty or invalid JSON; using local fallback plan');
    } catch (err) {
      this.logger.warn('PlanningAgent: prompt execution failed; using local fallback plan', { error: err });
    }

    this.logger.info('PlanningAgent: local fallback preserves provided locators and uses semantic names when locators are missing');
    return await this.createFallbackSteps(req, domSnapshot);
  }


  private parseSteps(output: string): any[] {
    const cleaned = this.cleanJsonOutput(output);
    if (!cleaned) return [];

    try {
      const parsed = JSON.parse(cleaned);
      const steps = Array.isArray(parsed) ? parsed : parsed.steps;
      if (Array.isArray(steps)) return this.normalizeSteps(steps);
    } catch {
      return [];
    }

    return [];
  }

  private cleanJsonOutput(output: string): string {
    const trimmed = output.trim();
    const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    return (fenced ? fenced[1] : trimmed).trim();
  }

  private async createFallbackSteps(req: any, domSnapshot?: string): Promise<any[]> {
    if (Array.isArray(req.steps) && req.steps.length) {
      return this.normalizeSteps(req.steps);
    }

    if (!domSnapshot && (!req.locators || Object.keys(req.locators).length === 0)) {
       try {
         const { DiscoveryAgent } = await import('../discovery/DiscoveryAgent');
         const discovery = new DiscoveryAgent();
         const url = req.applicationUrl ?? process.env.BASE_URL;
         if (url) {
           domSnapshot = await discovery.discoverDOM(url);
         }
       } catch (err) {
         this.logger.warn('PlanningAgent: fallback DOM discovery failed', { error: err });
       }
    }

    const locators = req.locators ?? {};
    const steps: any[] = [
      {
        step: 1,
        action: 'navigate',
        target: req.applicationUrl ?? process.env.BASE_URL,
      },
    ];

    if (!req.testData || typeof req.testData !== 'object') {
      return steps;
    }

    const lowerDom = (domSnapshot || '').toLowerCase();

    // Generic mapping of test data
    for (const [key, value] of Object.entries(req.testData)) {
      if (value === undefined || value === null) continue;

      let target = this.pickLocatorTarget(locators, [key, `${key}Input`, `${key}Field`], key);
      
      let verifiedInUI = false;

      // If we have DOM snapshot, verify target exists in UI before creating a step
      if (domSnapshot) {
         if (locators[target]) {
             verifiedInUI = true;
         } else {
             const locator = this.extractDynamicLocatorOffline(domSnapshot, key);
             if (locator) {
                target = `${key}Input`;
                locators[target] = locator;
                verifiedInUI = true;
             }
         }
      } else {
         verifiedInUI = true; // Without DOM, we must assume it's valid
      }

      if (!verifiedInUI) {
          this.logger.warn(`PlanningAgent: Target '${key}' from inputData not found in real DOM. Skipping offline step generation.`);
          continue;
      }

      steps.push({
        step: steps.length + 1,
        action: 'fill',
        target,
        value,
      });
    }
    
    // Dynamically look for any primary action button (submit/login/continue) in the DOM for forms
    if (domSnapshot && steps.length > 1) {
       const submitRegex = /<button[^>]*?(type=["']submit["']|id=["'][^"']*(submit|login|continue|sign-in)[^"']*["'])[^>]*?>/i;
       const match = domSnapshot.match(submitRegex);
       if (match) {
          const target = 'submitButton';
          steps.push({
             step: steps.length + 1,
             action: 'click',
             target
          });
          
          const typeMatch = match[1];
          if (typeMatch.toLowerCase() === 'type="submit"') {
              locators[target] = '//button[@type="submit"]';
          } else {
              const idRegex = /id=["']([^"']+)["']/.exec(typeMatch);
              if (idRegex && idRegex[1]) {
                  locators[target] = `//button[@id="${idRegex[1]}"]`;
              }
          }
       }
    }

    // Save locators back to request so they get exported to the Plan JSON
    req.locators = locators;

    return steps;
  }

  private extractDynamicLocatorOffline(dom: string, target: string): string | undefined {
    const cleanTarget = target.replace(/button|btn|link|input|field$/i, '').trim();
    if (!cleanTarget) return undefined;
    
    // Convert target to a loose regex pattern to match 'user-name' when target is 'username', or 'login_button' for 'login button'
    const looseTarget = cleanTarget.replace(/[-_\s]+/g, '').split('').join('[-_\\s]?');

    const attrRegex = new RegExp(`<([a-zA-Z0-9-]+)[^>]*?(id|name|data-[a-zA-Z0-9-]+|aria-label|placeholder)=["']?([^"'>]*?${looseTarget}[^"'>]*?)["']?[^>]*?>`, 'i');
    const match = dom.match(attrRegex);
    
    if (match) {
       const tag = match[1].toLowerCase();
       const attrName = match[2].toLowerCase();
       const attrValue = match[3];
       return `//${tag}[@${attrName}="${attrValue}"]`;
    }
    
    const textRegex = new RegExp(`<([a-zA-Z0-9-]+)[^>]*?>([^<]*?${looseTarget}[^<]*?)</\\1>`, 'i');
    const textMatch = dom.match(textRegex);
    if (textMatch) {
       const tag = textMatch[1].toLowerCase();
       const textValue = textMatch[2].trim();
       if (textValue) {
           return `//${tag}[contains(normalize-space(.), "${textValue}")]`;
       }
    }
    
    return undefined;
  }

  private escapeRegExp(string: string): string {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private normalizeLocatorAliases(locatorsInput: unknown): Record<string, string> {
    if (!locatorsInput || typeof locatorsInput !== 'object') return {};

    return Object.fromEntries(
      Object.entries(locatorsInput as Record<string, unknown>)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => [key, String(value).trim()])
        .filter(([, value]) => value.length > 0)
    );
  }

  private pickLocatorTarget(locators: Record<string, string>, candidates: string[], fallback: string): string {
    for (const candidate of candidates) {
      if (locators[candidate]) return candidate;
    }

    const normalizedCandidates = new Set(candidates.map((candidate) => this.normalizeKey(candidate)));
    const match = Object.keys(locators).find((key) => normalizedCandidates.has(this.normalizeKey(key)));
    return match ?? fallback;
  }

  private normalizeKey(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private normalizeSteps(steps: any[]): any[] {
    return steps.map((step, index) => ({
      ...step,
      step: step.step ?? index + 1,
      target: step.target ?? '',
      value: step.value ?? '',
    }));
  }

  private async scanForExistingTests(): Promise<string[]> {
    try {
      const { readdir } = await import('fs-extra');
      const testsDir = path.resolve('generated', 'tests');
      const files = await readdir(testsDir);
      return files.filter(f => f.endsWith('.spec.ts')).map(f => f.replace('.spec.ts', ''));
    } catch {
      return [];
    }
  }
}
