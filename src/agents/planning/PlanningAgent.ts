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
        scenario: normalizedReq.requirement ?? 'UnnamedScenario',
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
    try {
      const template = await readFile(this.promptPath, 'utf-8');
      const prompt = template.replace('{{REQUEST_JSON}}', rawRequest);
      this.logger.info(`PlanningAgent: using prompt template ${this.promptPath}`);
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
    return this.createFallbackSteps(req);
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

  private createFallbackSteps(req: any): any[] {
    if (Array.isArray(req.steps) && req.steps.length) {
      return this.normalizeSteps(req.steps);
    }

    const locators = req.locators ?? {};
    const requirement = String(req.requirement ?? '').toLowerCase();
    const usernameTarget = this.pickLocatorTarget(locators, ['usernameInput', 'username', 'userNameInput'], 'username');
    const passwordTarget = this.pickLocatorTarget(locators, ['passwordInput', 'password'], 'password');
    const loginButtonTarget = this.pickLocatorTarget(locators, ['loginButton', 'submitButton'], 'loginButton');
    const steps: any[] = [
      {
        step: 1,
        action: 'navigate',
        target: req.applicationUrl ?? process.env.BASE_URL,
      },
    ];

    if (requirement.includes('login')) {
      steps.push({
        step: steps.length + 1,
        action: 'assertVisible',
        target: usernameTarget,
        value: 'Login',
      });
    }

    if (req.testData?.username) {
      steps.push({
        step: steps.length + 1,
        action: 'fill',
        target: usernameTarget,
        value: req.testData.username,
      });
    }

    if (req.testData?.password) {
      steps.push({
        step: steps.length + 1,
        action: 'fill',
        target: passwordTarget,
        value: req.testData.password,
      });
    }

    if (req.testData?.username || req.testData?.password) {
      steps.push({
        step: steps.length + 1,
        action: 'click',
        target: loginButtonTarget,
      });
    }

    const itemNames = this.normalizeItems(req.testData?.items);
    if (itemNames.length && /cart|add .*item|items? to cart|shopping/i.test(requirement)) {
      steps.push({
        step: steps.length + 1,
        action: 'assertVisible',
        target: this.pickLocatorTarget(locators, ['productsTitle', 'productTitle', 'dashboard'], 'productsTitle'),
        value: 'Products',
      });

      for (const itemName of itemNames) {
        steps.push({
          step: steps.length + 1,
          action: 'click',
          target: this.pickCartItemTarget(locators, itemName),
          value: itemName,
        });
      }

      steps.push({
        step: steps.length + 1,
        action: 'click',
        target: this.pickLocatorTarget(locators, ['cartIcon', 'shoppingCartLink', 'cartLink'], 'cartIcon'),
      });

      for (const itemName of itemNames) {
        steps.push({
          step: steps.length + 1,
          action: 'assertText',
          target: this.pickLocatorTarget(locators, ['cartItemName', 'cartItems', 'inventoryItemName'], 'cartItemName'),
          value: itemName,
        });
      }

      return steps;
    }

    if (this.isCreateOrAddFlow(requirement, req.testData)) {
      this.appendCreateOrAddSteps(steps, req, locators, requirement);
      return steps;
    }

    const handledKeys = new Set(['username', 'password']);
    for (const [key, value] of Object.entries(req.testData ?? {})) {
      if (handledKeys.has(key) || value === undefined || value === null) continue;

      steps.push({
        step: steps.length + 1,
        action: this.inferInputAction(key, requirement),
        target: this.pickLocatorTarget(locators, [key], key),
        value,
      });
    }

    if (requirement.includes('search')) {
      steps.push({
        step: steps.length + 1,
        action: 'click',
        target: locators.searchButton ?? 'searchButton',
      });
      steps.push({
        step: steps.length + 1,
        action: req.expectedText ? 'assertText' : 'assertVisible',
        target: locators.searchResults ?? 'searchResults',
        value: req.expectedText ?? 'visible',
      });
      return steps;
    }

    if (requirement.includes('submit') || requirement.includes('create') || requirement.includes('register') || requirement.includes('form')) {
      steps.push({
        step: steps.length + 1,
        action: 'click',
        target: locators.submitButton ?? locators.saveButton ?? 'submitButton',
      });
      steps.push({
        step: steps.length + 1,
        action: req.expectedText ? 'assertText' : 'assertVisible',
        target: locators.successMessage ?? locators.expectedElement ?? 'successMessage',
        value: req.expectedText ?? 'visible',
      });
      return steps;
    }

    steps.push({
      step: steps.length + 1,
      action: req.expectedText ? 'assertText' : 'assertVisible',
      target: requirement.includes('product')
        ? this.pickLocatorTarget(locators, ['productsTitle', 'productTitle', 'expectedElement', 'dashboard'], 'productsTitle')
        : this.pickLocatorTarget(locators, ['expectedElement', 'dashboard', 'successMessage'], requirement.includes('login') ? 'dashboard' : 'page'),
      value: req.expectedText ?? (requirement.includes('login') ? 'Dashboard' : 'visible'),
    });

    return steps;
  }

  private inferInputAction(key: string, requirement: string): string {
    if (/country|state|type|category|dropdown|select/i.test(key)) return 'select';
    if (/search|query|keyword/i.test(key) || requirement.includes('search')) return 'fill';
    return 'fill';
  }

  private isCreateOrAddFlow(requirement: string, testData: Record<string, unknown> = {}): boolean {
    const hasFormData = Object.keys(testData).some((key) => !['username', 'password'].includes(key));
    return hasFormData && /\b(add|create|new|register)\b/i.test(requirement);
  }

  private appendCreateOrAddSteps(steps: any[], req: any, locators: Record<string, string>, requirement: string): void {
    const moduleTarget = this.pickNavigationTarget(locators, requirement);
    if (moduleTarget) {
      steps.push({
        step: steps.length + 1,
        action: 'click',
        target: moduleTarget,
      });
    }

    const addTarget = this.pickLocatorTarget(locators, ['addButton', 'createButton', 'newButton'], 'addButton');
    if (/\b(add|create|new)\b/i.test(requirement) && addTarget) {
      steps.push({
        step: steps.length + 1,
        action: 'click',
        target: addTarget,
      });
    }

    const formData = Object.entries(req.testData ?? {})
      .filter(([key, value]) => !['username', 'password'].includes(key) && value !== undefined && value !== null);

    for (const [key, value] of formData) {
      const target = this.pickDataLocatorTarget(locators, key);
      if (!target) continue;

      steps.push({
        step: steps.length + 1,
        action: this.inferFormAction(key, target, locators),
        target,
        value,
      });

      if (/password/i.test(key)) {
        const confirmTarget = this.pickLocatorTarget(locators, ['confirmPasswordInput', 'confirmPassword', 'retypePasswordInput'], '');
        if (confirmTarget && confirmTarget !== target) {
          steps.push({
            step: steps.length + 1,
            action: 'fill',
            target: confirmTarget,
            value,
          });
        }
      }
    }

    const saveTarget = this.pickLocatorTarget(locators, ['saveButton', 'submitButton', 'createButton'], '');
    if (saveTarget) {
      steps.push({
        step: steps.length + 1,
        action: 'click',
        target: saveTarget,
      });
    }

    if (/search|verify|results?/i.test(requirement)) {
      const searchValue = this.pickSearchValue(req.testData);
      const searchTarget = this.pickLocatorTarget(locators, ['searchUsernameInput', 'searchInput', 'searchBox', 'searchField'], '');
      if (searchTarget && searchValue) {
        steps.push({
          step: steps.length + 1,
          action: 'fill',
          target: searchTarget,
          value: searchValue,
        });
      }

      const searchButton = this.pickLocatorTarget(locators, ['searchButton', 'filterButton'], '');
      if (searchButton) {
        steps.push({
          step: steps.length + 1,
          action: 'click',
          target: searchButton,
        });
      }

      const resultsTarget = this.pickLocatorTarget(locators, ['tableRows', 'searchResults', 'resultsTable', 'tableBody'], 'searchResults');
      steps.push({
        step: steps.length + 1,
        action: 'assertText',
        target: resultsTarget,
        value: searchValue || req.expectedText || 'visible',
      });
    }
  }

  private pickDataLocatorTarget(locators: Record<string, string>, dataKey: string): string | undefined {
    const directCandidates = [
      dataKey,
      `${dataKey}Input`,
    ];
    const direct = this.pickLocatorTarget(locators, directCandidates, '');
    if (direct) return direct;

    return this.findBestFormLocator(locators, dataKey);
  }

  private inferFormAction(dataKey: string, target: string, locators: Record<string, string>): string {
    const locatorText = `${dataKey} ${target} ${locators[target] ?? ''}`;
    if (/dropdown|select|role|status/i.test(locatorText)) return 'selectByText';
    if (/autocomplete|employee/i.test(locatorText)) return 'fillAndChoose';
    return this.inferInputAction(dataKey, '');
  }

  private pickSearchValue(testData: Record<string, unknown> = {}): string {
    const preferred = Object.entries(testData).find(([key]) => /new.*user.*name|user.*name|name/i.test(key) && !/^username$/i.test(key));
    if (preferred) return String(preferred[1]);

    const fallback = Object.entries(testData).find(([key]) => !['username', 'password'].includes(key));
    return fallback ? String(fallback[1]) : '';
  }

  private pickNavigationTarget(locators: Record<string, string>, requirement: string): string | undefined {
    const words = this.significantWords(requirement);
    let best: { key: string; score: number } | undefined;

    for (const [key, selector] of Object.entries(locators)) {
      const text = this.locatorSearchText(key, selector);
      if (!/(module|menu|nav|tab|link|sidebar|href|\/web\/|\/admin\/)/i.test(text)) continue;
      if (/(input|field|search|filter|button|submit|save|add|login|password)/i.test(text)) continue;

      const score = words.filter((word) => text.includes(word)).length * 10
        + (/module|menu|nav|tab|link|href/i.test(text) ? 3 : 0);
      if (score > 0 && (!best || score > best.score)) best = { key, score };
    }

    return best?.key;
  }

  private findBestFormLocator(locators: Record<string, string>, dataKey: string): string | undefined {
    const words = this.significantWords(dataKey);
    const requiredWords = ['password', 'role', 'status', 'employee'].filter((word) => words.includes(word));
    let best: { key: string; score: number } | undefined;

    for (const [key, selector] of Object.entries(locators)) {
      const normalizedKey = this.normalizeKey(key);
      if (['applicationurl', 'username', 'password', 'loginbutton', 'dashboard'].includes(normalizedKey)) continue;
      const keyText = this.locatorSearchText(key, '');
      const text = this.locatorSearchText(key, selector);
      if (/(search|filter|module|menu|nav|tab|link|button|submit|save|add)/i.test(text)) continue;
      if (requiredWords.some((word) => !keyText.includes(word))) continue;
      if (words.includes('name') && !words.includes('employee') && /employee/i.test(text)) continue;

      const score = words.filter((word) => keyText.includes(word)).length * 15
        + words.filter((word) => text.includes(word)).length * 5
        + (/input|field|dropdown|select|autocomplete|textarea/i.test(text) ? 3 : 0)
        + (/new/i.test(text) ? 2 : 0);
      if (score > 0 && (!best || score > best.score)) best = { key, score };
    }

    return best?.key;
  }

  private locatorSearchText(key: string, selector: string): string {
    return `${key} ${selector}`
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[_-]+/g, ' ')
      .toLowerCase();
  }

  private normalizeItems(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.map((item) => String(item).trim()).filter(Boolean);
    }

    if (typeof value === 'string') {
      return value.split(',').map((item) => item.trim()).filter(Boolean);
    }

    return [];
  }

  private pickCartItemTarget(locators: Record<string, string>, itemName: string): string {
    return this.findBestLocatorForWords(locators, itemName, /add|cart|button|btn|link|select|choose/i) ?? itemName;
  }

  private findBestLocatorForWords(locators: Record<string, string>, label: string, actionHint?: RegExp): string | undefined {
    const words = this.significantWords(label);
    if (!words.length) return undefined;

    let best: { key: string; score: number } | undefined;
    for (const [key, selector] of Object.entries(locators)) {
      const normalizedKey = this.normalizeKey(key);
      if (['applicationurl', 'username', 'password', 'loginbutton', 'dashboard'].includes(normalizedKey)) continue;

      const text = `${key} ${selector}`.toLowerCase();
      const matchedWords = words.filter((word) => text.includes(word.toLowerCase())).length;
      if (!matchedWords) continue;

      const actionScore = actionHint && (actionHint.test(key) || actionHint.test(selector)) ? 2 : 0;
      const score = matchedWords * 10 + actionScore;
      if (!best || score > best.score) best = { key, score };
    }

    return best?.key;
  }

  private significantWords(value: string): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'to', 'for', 'of', 'and', 'item', 'items', 'product', 'products']);
    return (value.replace(/([a-z0-9])([A-Z])/g, '$1 $2').match(/[a-zA-Z0-9]+/g) ?? [])
      .map((word) => word.toLowerCase())
      .filter((word) => word.length > 1 && !stopWords.has(word));
  }

  private normalizeLocatorAliases(locatorsInput: unknown): Record<string, string> {
    if (!locatorsInput || typeof locatorsInput !== 'object') return {};

    const locators = Object.fromEntries(
      Object.entries(locatorsInput as Record<string, unknown>)
        .filter(([, value]) => value !== undefined && value !== null)
        .map(([key, value]) => [key, String(value).trim()])
        .filter(([, value]) => value.length > 0)
    );

    const addAlias = (alias: string, candidates: string[], pattern?: RegExp) => {
      if (locators[alias]) return;
      const candidate = this.findLocatorValue(locators, candidates, pattern);
      if (candidate) locators[alias] = candidate;
    };

    addAlias('username', ['username', 'usernameInput', 'userNameInput'], /user.?name/i);
    addAlias('password', ['password', 'passwordInput'], /password/i);
    addAlias('loginButton', ['loginButton', 'submitButton'], /(login|submit).*button|button.*(login|submit)/i);
    addAlias('dashboard', ['dashboard', 'productsTitle', 'productTitle', 'expectedElement'], /(dashboard|product.*title|expected)/i);

    return locators;
  }

  private findLocatorValue(locators: Record<string, string>, candidates: string[], pattern?: RegExp): string | undefined {
    const entries = Object.entries(locators);
    for (const candidate of candidates) {
      const normalizedCandidate = this.normalizeKey(candidate);
      const match = entries.find(([key]) => this.normalizeKey(key) === normalizedCandidate);
      if (match) return match[1];
    }

    if (pattern) {
      const match = entries.find(([key]) => pattern.test(key));
      if (match) return match[1];
    }

    return undefined;
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
}
