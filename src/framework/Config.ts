import * as dotenv from 'dotenv';
import path from 'path';
import Logger from '../utils/logger';

/**
 * Loads environment variables from the root .env and the selected environment file.
 * Validates that all required secrets are present and provides a type‑safe accessor.
 * Secrets are never logged in plain text – they are masked when written to logs.
 */
export class Config {
  private static instance: Config;
  private readonly logger = Logger.getInstance();
  private readonly env: Record<string, string> = {};

  private constructor() {
    // Load base .env
    const basePath = path.resolve(process.cwd(), '.env');
    dotenv.config({ path: basePath });

    // Load environment‑specific file if ENVIRONMENT is set
    const envName = process.env.ENVIRONMENT;
    if (envName) {
      const envPath = path.resolve(process.cwd(), 'environments', `${envName}.env`);
      dotenv.config({ path: envPath, override: true });
    }

    // Copy to internal map
    Object.assign(this.env, process.env);

    this.validate();
  }

  /** Singleton accessor */
  public static get(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  /** Get a required variable – throws if missing */
  public get(key: string): string {
    const value = this.env[key];
    if (value === undefined) {
      this.logger.error(`Missing required env variable: ${key}`);
      throw new Error(`Missing required env variable: ${key}`);
    }
    return value;
  }

  /** Helper to retrieve optional variable with fallback */
  public getOptional(key: string, fallback?: string): string | undefined {
    return this.env[key] ?? fallback;
  }

  /** Mask secret values when logging */
  private mask(value: string): string {
    if (value.length <= 4) return '****';
    const visible = value.slice(0, 2) + '*'.repeat(value.length - 4) + value.slice(-2);
    return visible;
  }

  /** Validate configuration. Missing values are logged because agents can fall back locally. */
  private validate(): void {
    const provider = this.env['LLM_PROVIDER']?.toLowerCase() ?? 'groq';

    if (!this.env['BASE_URL']) {
      this.logger.warn('BASE_URL is not configured; request applicationUrl or Playwright defaults will be used');
    }

    const providerKey = this.env[`${provider.toUpperCase()}_API_KEY`];
    if (!providerKey) {
      this.logger.warn(`No API key configured for ${provider}; agents will use local fallback behavior when LLM calls fail`);
    }

    this.logger.info('Configuration loaded', {
      BASE_URL: this.env['BASE_URL'] ? this.mask(this.env['BASE_URL']) : 'not configured',
      LLM_PROVIDER: provider,
      API_KEY: providerKey ? this.mask(providerKey) : 'not configured',
    });
  }
}
