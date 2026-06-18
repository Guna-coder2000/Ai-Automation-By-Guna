import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './generated',
  fullyParallel: process.env.HEADED === 'true' ? false : true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 90000,
  expect: { timeout: 30000 },
  use: {
    actionTimeout: 30000,
    baseURL: process.env.BASE_URL || 'https://example.com',
    headless: process.env.HEADLESS === 'true',
    trace: 'on',
    screenshot: 'on',
    video: 'on',
  },
  reporter: [
  ['list'],
  ['html', { outputFolder: 'playwright-report' }],
  ['allure-playwright', { outputFolder: 'allure-results' }],
],
  projects: [
    { name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
