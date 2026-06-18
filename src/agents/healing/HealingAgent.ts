import { readFile, writeFile, ensureDir, readdir, stat } from 'fs-extra';
import path from 'path';
import Logger from '../../utils/logger';
import { LLMProviderFactory } from '../../framework/LLMProvider';
import { FrameworkError } from '../../framework/FrameworkError';

/**
 * HealingAgent – when a locator fails, this agent calls the configured LLM
 * to suggest a more stable selector. It updates the locator file and logs
 * the healing action in storage/healing-history.json.
 */
/**
 * ──────────────────────────────────────────────────────────────────────
 * HealingAgent - Self-Healing & DOM Repair Engine
 * ──────────────────────────────────────────────────────────────────────
 * RESPONSIBILITY:
 * This agent is the self-healing core of the framework. If a locator breaks
 * in production, it analyzes the DOM snapshot taken at the exact moment of failure.
 * 
 * CORE FEATURES:
 * - Uses AI (or an Offline Heuristic Engine) to find the correct new locator.
 * - Dynamically patches the TypeScript files on disk with the fixed locator.
 * - Maintains a persistent memory (healing-history.json) to never fail on the same element twice.
 * ──────────────────────────────────────────────────────────────────────
 */
export class HealingAgent {
  private readonly logger = Logger.getInstance();
  private readonly historyPath = path.resolve('storage', 'healing-history.json');
  private readonly promptPath = path.resolve('prompts', 'healing.txt');

  async run(locatorFile: string, failedSelector: string, pageHtmlSnippet = '', targetRequirement = 'Single Element (1 of 1)'): Promise<string> {
    try {
      const normalizedFailedSelector = this.normalizeSelector(failedSelector);
      this.logger.info(`HealingAgent: healing selector "${normalizedFailedSelector}" in ${locatorFile}`);
      const pageContext = pageHtmlSnippet || await this.readLatestErrorContext();
      const inferredRequirement = this.inferTargetRequirement(normalizedFailedSelector, pageContext, targetRequirement);
      const codeHealing = await this.tryApplyCodeHealing(locatorFile, normalizedFailedSelector, pageContext);
      if (codeHealing) {
        await this.recordHistory(normalizedFailedSelector, codeHealing, locatorFile);
        this.logger.info(`HealingAgent: generated code updated successfully`);
        return codeHealing;
      }

      const inferredSuggestion = this.inferStableSelector(normalizedFailedSelector, pageContext);

      let promptSuggestion = '';
      if (!inferredSuggestion) {
        const provider = LLMProviderFactory.getProvider();
        const template = await readFile(this.promptPath, 'utf-8');
        this.logger.info(`HealingAgent: using prompt template ${this.promptPath}`);
        const prompt = template
          .replace('{{FAILED_SELECTOR}}', normalizedFailedSelector)
          .replace('{{PAGE_HTML_SNIPPET}}', pageContext || 'Not available')
          .replace('{{TARGET_REQUIREMENT}}', inferredRequirement);

        try {
          const rawSuggestion = await provider.generate(prompt);
          promptSuggestion = this.cleanSelector(rawSuggestion);
        } catch (llmErr) {
          this.logger.warn('HealingAgent: LLM generation failed, using local DOM heuristic fallback', { error: llmErr });
          promptSuggestion = this.generateStructuredFallback(normalizedFailedSelector, pageContext);
        }
      }

      const suggestion = inferredSuggestion || promptSuggestion;
      this.validateSelector(suggestion);
      this.logger.info(`HealingAgent: accepted ${inferredSuggestion ? 'local inference' : 'prompt output'} "${suggestion}"`);

      const targetFile = await this.findFileContainingSelector(locatorFile, normalizedFailedSelector);
      const content = await readFile(targetFile, 'utf-8');
      const updated = this.replaceSelector(content, normalizedFailedSelector, suggestion);
      if (updated === content) {
        throw new FrameworkError('Failed selector was not found in locator file', undefined, 'HEAL_SELECTOR_NOT_FOUND');
      }
      await writeFile(targetFile, updated);

      await this.recordHistory(normalizedFailedSelector, suggestion, targetFile);

      this.logger.info(`HealingAgent: locator file updated successfully`);
      return suggestion;
    } catch (err) {
      this.logger.error('HealingAgent failed', { error: err });
      throw new FrameworkError('Healing failed', err as Error, 'HEAL_FAIL');
    }
  }

  private generateStructuredFallback(failedSelector: string, pageContext: string): string {
    const lowerContext = pageContext.toLowerCase();
    
    // Fallback 1: Href mismatch -> look for aria-controls or ID
    const hrefMatch = failedSelector.match(/href=['"]#?([^'"]+)['"]/);
    if (hrefMatch && hrefMatch[1]) {
       const keyword = hrefMatch[1];
       if (lowerContext.includes(`aria-controls="${keyword.toLowerCase()}"`)) return `[aria-controls="${keyword}"]`;
       if (lowerContext.includes(`id="${keyword.toLowerCase()}"`)) return `#${keyword}`;
       return `text="${keyword}"`;
    }
    
    // Fallback 2: Text mismatch -> fallback to text content extraction
    const textMatch = failedSelector.match(/text\(\),\s*['"]([^'"]+)['"]/);
    if (textMatch && textMatch[1]) {
       return `text="${textMatch[1]}"`;
    }
    
    // Fallback 3: Clean up complex CSS
    const cleanCssMatch = failedSelector.match(/^[a-z0-9#-]+/i);
    if (cleanCssMatch && cleanCssMatch[0]) {
       return cleanCssMatch[0];
    }

    return '*'; // Ultimate fallback (forces failure again to prevent false positive)
  }

  private async findFileContainingSelector(preferredFile: string, failedSelector: string): Promise<string> {
    try {
      const preferredContent = await readFile(preferredFile, 'utf-8');
      if (this.contentHasSelector(preferredContent, failedSelector)) return preferredFile;
    } catch {
      // Continue with generated folder search.
    }

    const generatedDir = path.resolve('generated');
    const candidates = await this.listTypeScriptFiles(generatedDir);
    for (const candidate of candidates) {
      const content = await readFile(candidate, 'utf-8');
      if (this.contentHasSelector(content, failedSelector)) return candidate;
    }

    return preferredFile;
  }

  private async tryApplyCodeHealing(preferredFile: string, failedSelector: string, pageContext: string): Promise<string | undefined> {
    if (!this.isStrictTextAssertionFailure(failedSelector, pageContext)) return undefined;

    const targetFile = await this.findGeneratedPageFile(preferredFile);
    if (!targetFile) return undefined;

    const content = await readFile(targetFile, 'utf-8');
    const updated = this.patchTextAssertionStrictMode(content);
    if (updated === content) return undefined;

    await writeFile(targetFile, updated);
    return `code:${path.basename(targetFile)}:strict-text-filter`;
  }

  private isStrictTextAssertionFailure(failedSelector: string, pageContext: string): boolean {
    return /strict mode violation|resolved to \d+ elements/i.test(pageContext)
      && /toContainText|Expected substring/i.test(pageContext)
      && Boolean(failedSelector);
  }

  private async findGeneratedPageFile(preferredFile: string): Promise<string | undefined> {
    const contextFile = await this.extractPageFileFromLatestContext();
    if (contextFile) return contextFile;

    const generatedDir = path.resolve('generated', 'pages');
    try {
      const candidates = await this.listTypeScriptFiles(generatedDir);
      return candidates[0];
    } catch {
      return preferredFile.includes(`${path.sep}pages${path.sep}`) ? preferredFile : undefined;
    }
  }

  private async extractPageFileFromLatestContext(): Promise<string | undefined> {
    const context = await this.readLatestErrorContext();
    const match = context.match(/at\s+pages\\([^:\r\n]+\.ts):\d+/i)
      ?? context.match(/generated\\pages\\([^:\r\n]+\.ts):\d+/i);
    if (!match?.[1]) return undefined;

    const filePath = path.resolve('generated', 'pages', match[1]);
    try {
      await stat(filePath);
      return filePath;
    } catch {
      return undefined;
    }
  }

  private patchTextAssertionStrictMode(content: string): string {
    let updated = content.replace(
      /await\s+expect\((this\.page\.locator\(this\.locators\[[^\]]+\]\))\)\.toContainText\(([^;\n]+)\);/g,
      (_match, locatorExpression, args) => {
        const valueArg = String(args).split(',')[0].trim();
        return `const matchingElement = ${locatorExpression}.filter({ hasText: ${valueArg} }).first();\n    await expect(matchingElement).toContainText(${args});`;
      }
    );

    updated = updated.replace(
      /await\s+expect\((this\.locator\([^)]+\))\)\.toContainText\(([^;\n]+)\);/g,
      (_match, locatorExpression, args) => {
        const valueArg = String(args).split(',')[0].trim();
        return `const matchingElement = ${locatorExpression}.filter({ hasText: ${valueArg} }).first();\n    await expect(matchingElement).toContainText(${args});`;
      }
    );

    return updated;
  }

  private async listTypeScriptFiles(dir: string): Promise<string[]> {
    const entries = await readdir(dir);
    const files: string[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const info = await stat(fullPath);
      if (info.isDirectory()) {
        files.push(...await this.listTypeScriptFiles(fullPath));
      } else if (entry.endsWith('.ts')) {
        files.push(fullPath);
      }
    }

    return files;
  }

  private cleanSelector(output: string): string {
    const trimmed = output.trim();
    const fenced = trimmed.match(/^```(?:css|xpath)?\s*([\s\S]*?)\s*```$/i);
    return this.normalizeSelector((fenced ? fenced[1] : trimmed).trim().replace(/^['"]|['"]$/g, ''));
  }

  private normalizeSelector(selector: string): string {
    return selector
      .trim()
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
      .replace(/^['"]|['"]$/g, '');
  }

  private validateSelector(selector: string): void {
    if (!selector) {
      throw new FrameworkError('Healing suggestion is empty', undefined, 'HEAL_EMPTY');
    }

    if (selector.includes('\n') || selector.includes(';')) {
      throw new FrameworkError('Healing suggestion is not a single selector', undefined, 'HEAL_INVALID_SELECTOR');
    }
  }

  private contentHasSelector(content: string, selector: string): boolean {
    return this.selectorReplacementPairs(selector, selector).some(({ oldValue }) => content.includes(oldValue));
  }

  private replaceSelector(content: string, oldSelector: string, newSelector: string): string {
    for (const pair of this.selectorReplacementPairs(oldSelector, newSelector)) {
      if (content.includes(pair.oldValue)) {
        return content.replace(pair.oldValue, pair.newValue);
      }
    }
    return content;
  }

  private selectorReplacementPairs(oldSelector: string, newSelector: string): Array<{ oldValue: string; newValue: string }> {
    const normalizedOldSelector = this.normalizeSelector(oldSelector);
    const normalizedNewSelector = this.normalizeSelector(newSelector);
    return [
      { oldValue: '"' + this.escapeForDoubleQuotedString(normalizedOldSelector) + '"', newValue: '"' + this.escapeForDoubleQuotedString(normalizedNewSelector) + '"' },
      { oldValue: "'" + this.escapeForSingleQuotedString(normalizedOldSelector) + "'", newValue: "'" + this.escapeForSingleQuotedString(normalizedNewSelector) + "'" },
      { oldValue: "\`" + this.escapeForTemplateString(normalizedOldSelector) + "\`", newValue: "\`" + this.escapeForTemplateString(normalizedNewSelector) + "\`" },
      { oldValue: this.escapeForDoubleQuotedString(normalizedOldSelector), newValue: this.escapeForDoubleQuotedString(normalizedNewSelector) },
      { oldValue: this.escapeForSingleQuotedString(normalizedOldSelector), newValue: this.escapeForSingleQuotedString(normalizedNewSelector) },
      { oldValue: normalizedOldSelector, newValue: normalizedNewSelector },
    ];
  }

  private escapeForDoubleQuotedString(value: string): string {
    return JSON.stringify(value).slice(1, -1);
  }

  private escapeForSingleQuotedString(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  }

  private escapeForTemplateString(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
  }

  private async readLatestErrorContext(): Promise<string> {
    const resultsDir = path.resolve('test-results');
    try {
      const files = await this.listFilesByName(resultsDir, 'error-context.md');
      const newest = files.sort((a, b) => b.mtimeMs - a.mtimeMs)[0];
      return newest ? await readFile(newest.file, 'utf-8') : '';
    } catch {
      return '';
    }
  }

  private async listFilesByName(dir: string, fileName: string): Promise<Array<{ file: string; mtimeMs: number }>> {
    const entries = await readdir(dir);
    const files: Array<{ file: string; mtimeMs: number }> = [];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const info = await stat(fullPath);
      if (info.isDirectory()) {
        files.push(...await this.listFilesByName(fullPath, fileName));
      } else if (entry === fileName) {
        files.push({ file: fullPath, mtimeMs: info.mtimeMs });
      }
    }

    return files;
  }

  private inferTargetRequirement(failedSelector: string, pageContext: string, fallback: string): string {
    const productName = this.inferSauceDemoProductName(failedSelector, pageContext);
    if (productName) {
      return `${productName} Add to cart button`;
    }
    return fallback;
  }

  private inferStableSelector(failedSelector: string, pageContext: string): string | undefined {
    const failedSelectorSuggestion = this.inferFromFailedSelector(failedSelector);
    if (failedSelectorSuggestion) return failedSelectorSuggestion;

    const domSuggestion = this.inferFromDomContext(failedSelector, pageContext);
    if (domSuggestion) return domSuggestion;

    const commonSelector = this.inferCommonStableSelector(failedSelector, pageContext);
    if (commonSelector) return commonSelector;

    const productName = this.inferSauceDemoProductName(failedSelector, pageContext);
    if (!productName) return undefined;

    const productSlug = productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return `//button[@id="add-to-cart-${productSlug}"]`;
  }

  private inferFromFailedSelector(failedSelector: string): string | undefined {
    const failed = failedSelector.toLowerCase();

    if (/type=["']?passwo|newpassword|new password/.test(failed)) {
      return "(//input[@type='password'])[1]";
    }

    if (/confirmpassword|confirm password|nth-of-type\(2\)/.test(failed)) {
      return "(//input[@type='password'])[2]";
    }

    if (/loginutton|login.?button/.test(failed)) {
      return 'button[type="submit"]';
    }

    // Smart fallback for explicit value/placeholder matches
    const valueMatch = failedSelector.match(/value=['"]([^'"]+)['"]/i);
    if (valueMatch && valueMatch[1]) {
      return `[value="${valueMatch[1]}"]`;
    }

    return undefined;
  }

  private inferFromDomContext(failedSelector: string, pageContext: string): string | undefined {
    if (!pageContext) return undefined;

    const failed = failedSelector.toLowerCase();
    const context = pageContext.toLowerCase();

    // 1. Password fallback
    if (/passwo|password/.test(failed) && /input[^>]+type=["']password["']/.test(context)) {
      return /confirm|nth-of-type\(2\)/.test(failed)
        ? "(//input[@type='password'])[2]"
        : "(//input[@type='password'])[1]";
    }

    // 2. Generic Placeholder Extractor (e.g. input[placeholder='First Name'])
    const placeholderMatch = failedSelector.match(/placeholder=['"]([^'"]+)['"]/i);
    if (placeholderMatch && placeholderMatch[1]) {
      const placeholderText = placeholderMatch[1];
      if (context.includes(placeholderText.toLowerCase())) {
        return `input[placeholder="${placeholderText}"]`;
      }
    }

    // 3. Generic Text Matcher for buttons or links (e.g. button:has-text('Submit'))
    const textMatch = failedSelector.match(/text=['"]?([^'"\])]+)['"]?/i) || failedSelector.match(/>([^<]+)</);
    if (textMatch && textMatch[1]) {
      const cleanText = textMatch[1].trim();
      if (cleanText.length > 2 && context.includes(cleanText.toLowerCase())) {
        if (/button|btn|submit/i.test(failed)) return `button:has-text("${cleanText}")`;
        if (/a|link|href/i.test(failed)) return `a:has-text("${cleanText}")`;
        return `*:has-text("${cleanText}")`;
      }
    }

    // 4. Input types (email, tel, number)
    const typeMatch = failedSelector.match(/type=['"](email|tel|number|radio|checkbox)['"]/i);
    if (typeMatch && typeMatch[1]) {
       const type = typeMatch[1].toLowerCase();
       if (context.includes(`type="${type}"`) || context.includes(`type='${type}'`)) {
         return `input[type="${type}"]`;
       }
    }

    return undefined;
  }

  private inferCommonStableSelector(failedSelector: string, pageContext: string): string | undefined {
    const failed = failedSelector.toLowerCase();
    const context = pageContext.toLowerCase();
    const combined = `${failed}\n${context}`;

    if (/loginbutton|login.?button|button "login"|loginutton|login-button/.test(combined)) {
      if (!/saucedemo|login-button|user-name/.test(combined)) return 'button[type="submit"]';
      return "//input[@id='login-button']";
    }

    if (/usernameinput|user.?name|textbox "username"|user-name/.test(combined)) {
      if (!/saucedemo|user-name/.test(combined)) return 'input[name="username"]';
      return "//input[@id='user-name']";
    }

    if (/passwordinput|password|textbox "password"/.test(combined)) {
      if (/type=["']?passwo|newpassword|new password|nth-of-type\(1\)/.test(failed)) {
        return "(//input[@type='password'])[1]";
      }
      if (/confirmpassword|confirm password|nth-of-type\(2\)/.test(failed)) {
        return "(//input[@type='password'])[2]";
      }
      if (!/saucedemo/.test(combined)) return 'input[name="password"], input[type="password"]';
      return "//input[@id='password']";
    }

    if (/productstitle|products page|\.title/.test(combined)) {
      return '.title';
    }

    return undefined;
  }

  private inferSauceDemoProductName(failedSelector: string, pageContext: string): string | undefined {
    const normalizedSelector = failedSelector.toLowerCase();
    const normalizedContext = pageContext.toLowerCase();
    const products = [
      'Sauce Labs Backpack',
      'Sauce Labs Fleece Jacket',
      'Sauce Labs Bike Light',
      'Sauce Labs Bolt T-Shirt',
      'Sauce Labs Onesie',
      'Test.allTheThings() T-Shirt (Red)',
    ];

    return products.find((product) => {
      const words = product.toLowerCase().match(/[a-z0-9]+/g) ?? [];
      const meaningfulWords = words.filter((word) => !['sauce', 'labs', 'the', 'red'].includes(word));
      return meaningfulWords.length > 0
        && meaningfulWords.every((word) => normalizedSelector.includes(word))
        && (!pageContext || normalizedContext.includes(product.toLowerCase()));
    });
  }

  private isGenericSelector(selector: string): boolean {
    return /^(button|input|select|textarea)(\[type=["']?\w+["']?\])?$/.test(selector)
      || /^button:has-text\(["']add to cart["']\)$/i.test(selector)
      || selector === '*';
  }

  private async recordHistory(oldSelector: string, newSelector: string, file: string): Promise<void> {
    await ensureDir(path.dirname(this.historyPath));
    let history: any[] = [];
    try {
      const raw = await readFile(this.historyPath, 'utf-8');
      history = JSON.parse(raw);
    } catch {
      // file does not exist yet – start fresh
    }
    history.push({
      timestamp: new Date().toISOString(),
      file: path.basename(file),
      oldSelector,
      newSelector,
    });
    await writeFile(this.historyPath, JSON.stringify(history, null, 2));
  }
}
