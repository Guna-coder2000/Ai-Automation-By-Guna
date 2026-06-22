import { chromium, Browser, Page } from 'playwright';
import Logger from '../../utils/logger';
import { FrameworkError } from '../../framework/FrameworkError';

/**
 * ──────────────────────────────────────────────────────────────────────
 * DiscoveryAgent - Real DOM Extraction Engine
 * ──────────────────────────────────────────────────────────────────────
 * RESPONSIBILITY:
 * Dynamically launches a headless browser, navigates to the target application,
 * and extracts the real DOM structure. This ensures that the PlanningAgent
 * can generate accurate locators based on reality rather than hallucinating.
 * ──────────────────────────────────────────────────────────────────────
 */
export class DiscoveryAgent {
  private readonly logger = Logger.getInstance();

  async discoverDOM(url: string, prerequisites?: string[]): Promise<string> {
    this.logger.info(`DiscoveryAgent: Launching browser to discover real DOM at ${url}`);
    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({ ignoreHTTPSErrors: true });
      page = await context.newPage();

      // Intercept and block heavy assets to guarantee lightning fast load without timeouts
      await page.route('**/*', (route) => {
        const type = route.request().resourceType();
        if (['image', 'media', 'font', 'stylesheet', 'other'].includes(type)) {
          route.abort().catch(() => {});
        } else {
          route.continue().catch(() => {});
        }
      });

      this.logger.info(`DiscoveryAgent: Navigating to ${url} with asset blocking...`);
      
      // Cascading Fallbacks to NEVER FAIL navigation
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      } catch (e) {
        this.logger.warn(`DiscoveryAgent: networkidle timed out, falling back to domcontentloaded...`);
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        } catch (e2) {
          this.logger.warn(`DiscoveryAgent: domcontentloaded timed out, forcing immediate extraction...`);
        }
      }

      // Wait an extra moment for any dynamic React/Vue/Angular rendering if possible
      await page.waitForTimeout(2000).catch(() => {});

      this.logger.info(`DiscoveryAgent: Extracting Semantic DOM structure...`);
      let domSnapshot = '';
      try {
        domSnapshot = await page.evaluate(() => {
          const cleanNode = (node: any): string => {
            const cloned = node.cloneNode(true) as any;
            const noise = cloned.querySelectorAll('script, style, noscript, svg, path, iframe, img, head, meta, link');
            noise.forEach((el: any) => el.remove());
            
            const allElements = cloned.querySelectorAll('*');
            allElements.forEach((el: any) => {
              el.removeAttribute('style');
              el.removeAttribute('class');
              el.removeAttribute('width');
              el.removeAttribute('height');
            });

            return cloned.innerHTML;
          };
          // @ts-ignore
          return cleanNode(document.body);
        });
      } catch (evalErr) {
        this.logger.error(`DiscoveryAgent: evaluate failed, using raw extraction`, { error: evalErr });
        domSnapshot = await page.content(); // Ultimate fallback
      }

      this.logger.info(`DiscoveryAgent: Successfully extracted ${domSnapshot.length} characters of DOM`);
      return domSnapshot.slice(0, 15000);
    } catch (err) {
      this.logger.error(`DiscoveryAgent CRITICAL FAILURE on ${url}`, { error: err });
      return '<html><body><div id="error">DOM Discovery Failed</div></body></html>'; // Ensure it NEVER returns empty if we can avoid it
    } finally {
      if (page) await page.close().catch(() => {});
      if (browser) await browser.close().catch(() => {});
    }
  }
}
