/**
 * ──────────────────────────────────────────────────────────────────────
 * LLMProvider.ts — AI Provider Layer with Automatic Fallback
 * ──────────────────────────────────────────────────────────────────────
 *
 * This module manages all LLM (Large Language Model) provider integrations.
 * It supports: Groq, OpenAI, Anthropic, and Ollama (local).
 *
 * FALLBACK CHAIN:
 *   Primary Provider (e.g. Groq) → Ollama (local fallback)
 *
 * If the primary provider fails (API key missing, rate limit, network error),
 * the system automatically falls back to Ollama running locally.
 * This ensures the framework NEVER stops due to AI unavailability.
 *
 * Usage:
 *   const provider = LLMProviderFactory.getProvider();
 *   const response = await provider.generate("your prompt here");
 * ──────────────────────────────────────────────────────────────────────
 */

import fetch from 'node-fetch';
import type { Response as FetchResponse } from 'node-fetch';
import Logger from '../utils/logger';

// ──────────────────────────────────────────────────────────────────────
// Interface — Every provider must implement this contract
// ──────────────────────────────────────────────────────────────────────

/**
 * Generic interface for LLM providers.
 * All providers (Groq, OpenAI, Anthropic, Ollama) implement this.
 */
export interface LLMProvider {
  /**
   * Send a prompt to the LLM and receive a text response.
   * @param prompt The user prompt or system instruction.
   * @returns The AI-generated response text.
   */
  generate(prompt: string): Promise<string>;

  /**
   * Human-readable name of this provider for logging.
   */
  readonly name: string;
}

// ──────────────────────────────────────────────────────────────────────
// Factory — Builds the right provider with automatic fallback
// ──────────────────────────────────────────────────────────────────────

/**
 * Factory that returns the appropriate provider based on `LLM_PROVIDER` env var.
 * Supported values: "groq", "openai", "anthropic", "ollama".
 *
 * By default, wraps the selected provider in a FallbackProvider
 * so if the primary fails, Ollama (local) kicks in automatically.
 */
export class LLMProviderFactory {
  private static logger = Logger.getInstance();

  /**
   * Get the configured LLM provider with automatic Ollama fallback.
   * The fallback ensures the pipeline never stops due to AI unavailability.
   */
  static getProvider(): LLMProvider {
    const providerName = (process.env.LLM_PROVIDER || 'groq').toLowerCase();
    this.logger.info(`Selecting LLM provider: ${providerName}`);

    const primary = this.createProvider(providerName);
    const ollamaFallback = new OllamaProvider();

    // If user explicitly chose Ollama, return it directly (no fallback needed)
    if (providerName === 'ollama') {
      return primary;
    }

    if (process.env.DISABLE_LLM_FALLBACK === 'true') {
      this.logger.info(`Fallback disabled via env var. Using pure ${providerName} only.`);
      return primary;
    }

    // Wrap primary with Ollama fallback for resilience
    return new FallbackProvider(primary, ollamaFallback);
  }

  /**
   * Create a specific provider instance by name.
   */
  private static createProvider(name: string): LLMProvider {
    switch (name) {
      case 'groq':
        return new GroqProvider();
      case 'openai':
        return new OpenAIProvider();
      case 'anthropic':
        return new AnthropicProvider();
      case 'ollama':
        return new OllamaProvider();
      default:
        this.logger.warn(`Unknown LLM provider "${name}", falling back to Groq`);
        return new GroqProvider();
    }
  }
}

// ──────────────────────────────────────────────────────────────────────
// FallbackProvider — Tries primary, auto-falls back to secondary
// ──────────────────────────────────────────────────────────────────────

/**
 * Wraps a primary provider with a fallback provider.
 * If the primary provider throws ANY error, the fallback is used automatically.
 * This ensures the pipeline never stops due to AI unavailability.
 */
class FallbackProvider implements LLMProvider {
  readonly name: string;
  private readonly primary: LLMProvider;
  private readonly fallback: LLMProvider;
  private readonly logger = Logger.getInstance();

  constructor(primary: LLMProvider, fallback: LLMProvider) {
    this.primary = primary;
    this.fallback = fallback;
    this.name = `${primary.name}→${fallback.name}`;
  }

  async generate(prompt: string): Promise<string> {
    // Step 1: Try the primary provider
    try {
      const result = await this.primary.generate(prompt);
      if (result && result.trim().length > 0) {
        return result;
      }
      this.logger.warn(`${this.primary.name} returned empty response, switching to ${this.fallback.name}`);
    } catch (primaryErr) {
      const errMsg = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
      this.logger.warn(`${this.primary.name} failed: ${errMsg}. Switching to fallback: ${this.fallback.name}`);
    }

    // Step 2: Fallback to secondary provider
    try {
      this.logger.info(`Using fallback provider: ${this.fallback.name}`);
      return await this.fallback.generate(prompt);
    } catch (fallbackErr) {
      const errMsg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
      this.logger.error(`Both ${this.primary.name} and ${this.fallback.name} failed. Last error: ${errMsg}`);
      throw new Error(`All LLM providers failed. Primary (${this.primary.name}): unavailable. Fallback (${this.fallback.name}): ${errMsg}`);
    }
  }
}

// ──────────────────────────────────────────────────────────────────────
// Groq Provider — Fast cloud-based inference
// ──────────────────────────────────────────────────────────────────────

class GroqProvider implements LLMProvider {
  readonly name = 'Groq';
  private apiKey = process.env.GROQ_API_KEY;
  private endpoint = 'https://api.groq.com/openai/v1/chat/completions';

  async generate(prompt: string): Promise<string> {
    if (!this.apiKey) throw new Error('GROQ_API_KEY not set');
    const body = {
      model: process.env.GROQ_MODEL || process.env.LLM_MODEL || 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      max_tokens: 4096,
    };

    let response = await fetchWithRetry(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    }, 'Groq');

    // Handle Groq-specific rate limiting with smart retry
    if (response.status === 429) {
      const errorText = await response.clone().text();
      const waitMatch = errorText.match(/try again in (?:(\d+)m)?([\d.]+)s/i);
      if (waitMatch) {
        const mins = waitMatch[1] ? parseInt(waitMatch[1]) : 0;
        const secs = parseFloat(waitMatch[2]);
        const calculatedWaitTime = (mins * 60 + secs) * 1000 + 1000;
        
        if (calculatedWaitTime > 60000) {
           Logger.getInstance().warn(`Groq rate limit requires waiting ${Math.ceil(calculatedWaitTime/60000)}m. Skipping wait and falling back immediately.`);
           throw new Error(errorText);
        }

        const waitTime = calculatedWaitTime;
        Logger.getInstance().warn(`Groq rate limit reached for ${body.model}. Waiting ${Math.round(waitTime / 1000)}s before retrying...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        response = await fetchWithRetry(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(body),
        }, 'Groq');
      } else {
        Logger.getInstance().warn(`Groq rate limit reached but no wait time provided. Error: ${errorText}`);
      }
    }

    await ensureOk(response, 'Groq');
    const data: any = await response.json();
    return data?.choices?.[0]?.message?.content?.trim() ?? '';
  }
}

// ──────────────────────────────────────────────────────────────────────
// Ollama Provider — Local AI inference (runs on your machine)
// ──────────────────────────────────────────────────────────────────────

/**
 * OllamaProvider connects to a locally running Ollama instance.
 * This is the FALLBACK provider — always available when cloud AI is down.
 *
 * Setup: Install Ollama from https://ollama.ai
 *        Run: ollama pull llama3
 *        The server runs automatically on http://localhost:11434
 */
class OllamaProvider implements LLMProvider {
  readonly name = 'Ollama';
  private endpoint = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434';
  private model = process.env.OLLAMA_MODEL || 'llama3';

  async generate(prompt: string): Promise<string> {
    const url = `${this.endpoint}/api/generate`;
    const body = {
      model: this.model,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.1,
        num_predict: 4096,
      },
    };

    Logger.getInstance().info(`Ollama: sending request to ${this.endpoint} using model "${this.model}"`);

    const response = await fetchWithRetry(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }, 'Ollama');

    await ensureOk(response, 'Ollama');
    const data: any = await response.json();
    return (data?.response ?? '').trim();
  }
}

// ──────────────────────────────────────────────────────────────────────
// OpenAI Provider
// ──────────────────────────────────────────────────────────────────────

class OpenAIProvider implements LLMProvider {
  readonly name = 'OpenAI';
  private apiKey = process.env.OPENAI_API_KEY;
  private endpoint = process.env.OPENAI_ENDPOINT || 'https://api.openai.com/v1/chat/completions';

  async generate(prompt: string): Promise<string> {
    if (!this.apiKey) throw new Error('OPENAI_API_KEY not set');
    const body = {
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    };
    const response = await fetchWithRetry(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    }, 'OpenAI');
    await ensureOk(response, 'OpenAI');
    const data: any = await response.json();
    return data?.choices?.[0]?.message?.content?.trim() ?? '';
  }
}

// ──────────────────────────────────────────────────────────────────────
// Anthropic Provider
// ──────────────────────────────────────────────────────────────────────

class AnthropicProvider implements LLMProvider {
  readonly name = 'Anthropic';
  private apiKey = process.env.ANTHROPIC_API_KEY;
  private endpoint = process.env.ANTHROPIC_ENDPOINT || 'https://api.anthropic.com/v1/messages';

  async generate(prompt: string): Promise<string> {
    if (!this.apiKey) throw new Error('ANTHROPIC_API_KEY not set');
    const body = {
      model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20240620',
      max_tokens: 1024,
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }],
    };
    const response = await fetchWithRetry(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    }, 'Anthropic');
    await ensureOk(response, 'Anthropic');
    const data: any = await response.json();
    return data?.content?.[0]?.text?.trim() ?? '';
  }
}

// ──────────────────────────────────────────────────────────────────────
// Shared Utilities — Retry, Error Handling
// ──────────────────────────────────────────────────────────────────────

/**
 * Fetch with automatic retry (exponential backoff).
 * Retries on network errors and 5xx server errors.
 * Does NOT retry on 4xx client errors (except 429 rate limit).
 */
async function fetchWithRetry(
  url: string,
  options: any,
  providerName: string,
  maxRetries = 2,
  baseDelayMs = 1000
): Promise<FetchResponse> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, { ...options, timeout: 120000 });

      // Don't retry on client errors (except 429 which is handled by the provider)
      if (response.status >= 400 && response.status < 500) {
        return response;
      }

      // Retry on server errors (5xx)
      if (response.status >= 500 && attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        Logger.getInstance().warn(`${providerName}: server error ${response.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      return response;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        Logger.getInstance().warn(`${providerName}: network error, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries}): ${lastError.message}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error(`${providerName}: all retry attempts exhausted`);
}

/**
 * Validate HTTP response — throw descriptive error if not OK.
 */
async function ensureOk(response: FetchResponse, provider: string): Promise<void> {
  if (response.ok) return;

  const body = await response.text();
  throw new Error(`${provider} LLM request failed with ${response.status} ${response.statusText}: ${body.slice(0, 500)}`);
}
