/**
 * ──────────────────────────────────────────────────────────────────────
 * CommonApiActions.ts — Universal API Action Library
 * ──────────────────────────────────────────────────────────────────────
 *
 * This is the SINGLE ACTION LAYER for API testing in the framework.
 * Every API interaction (GET, POST, PUT, DELETE) is handled here.
 *
 * DESIGN RULES:
 *   - EVERY action has error handling and automatic response logging.
 *   - Automatic status code assertion.
 * ──────────────────────────────────────────────────────────────────────
 */

import { expect, APIRequestContext, APIResponse } from '@playwright/test';
import Logger from '../utils/logger';
import { FrameworkError } from './FrameworkError';

export class CommonApiActions {
  private readonly request: APIRequestContext;
  private readonly logger = Logger.getInstance();

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  async get(endpoint: string, expectedStatus = 200, headers?: Record<string, string>): Promise<any> {
    try {
      this.logger.info(`GET ${endpoint}`);
      const response = await this.request.get(endpoint, { headers });
      await this.assertStatus(response, expectedStatus);
      return await this.parseResponse(response);
    } catch (err) {
      this.handleError('GET', endpoint, err);
    }
  }

  async post(endpoint: string, data: any, expectedStatus = 201, headers?: Record<string, string>): Promise<any> {
    try {
      this.logger.info(`POST ${endpoint} with payload`);
      const response = await this.request.post(endpoint, { data, headers });
      await this.assertStatus(response, expectedStatus);
      return await this.parseResponse(response);
    } catch (err) {
      this.handleError('POST', endpoint, err);
    }
  }

  async put(endpoint: string, data: any, expectedStatus = 200, headers?: Record<string, string>): Promise<any> {
    try {
      this.logger.info(`PUT ${endpoint}`);
      const response = await this.request.put(endpoint, { data, headers });
      await this.assertStatus(response, expectedStatus);
      return await this.parseResponse(response);
    } catch (err) {
      this.handleError('PUT', endpoint, err);
    }
  }

  async delete(endpoint: string, expectedStatus = 200, headers?: Record<string, string>): Promise<any> {
    try {
      this.logger.info(`DELETE ${endpoint}`);
      const response = await this.request.delete(endpoint, { headers });
      await this.assertStatus(response, expectedStatus);
      return await this.parseResponse(response);
    } catch (err) {
      this.handleError('DELETE', endpoint, err);
    }
  }

  private async assertStatus(response: APIResponse, expected: number) {
    const status = response.status();
    if (status !== expected) {
       let bodyText = '';
       try { bodyText = await response.text(); } catch {}
       throw new Error(`Expected status ${expected} but got ${status}. Response: ${bodyText}`);
    }
    expect(status).toBe(expected);
  }

  private async parseResponse(response: APIResponse): Promise<any> {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  private handleError(action: string, endpoint: string, err: unknown): never {
    this.logger.error(`API ${action} failed on ${endpoint}`, { error: err });
    throw new FrameworkError(`API ${action} failed on ${endpoint}`, err as Error, 'API_FAIL');
  }
}
