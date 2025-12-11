/**
 * WATT Cucumber World
 *
 * The World is Cucumber's isolated context for each scenario
 * It holds the browser, page, and shared state between steps
 */

import { setWorldConstructor, World, IWorldOptions } from '@cucumber/cucumber';
import { BrowserContext, Page, Browser } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';

export interface CustomWorldParameters {
  browser: 'chromium' | 'firefox' | 'webkit';
  headless: boolean;
  baseUrl: string;
  video: 'on' | 'off' | 'retain-on-failure';
  screenshot: 'on' | 'off' | 'only-on-failure';
}

export class CustomWorld extends World<CustomWorldParameters> {
  // Playwright objects
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;

  // Page objects
  loginPage!: LoginPage;

  // Test state
  testData: Record<string, unknown> = {};
  startTime!: Date;

  constructor(options: IWorldOptions<CustomWorldParameters>) {
    super(options);
  }

  /**
   * Initialize browser context before scenario
   */
  async init(browser: Browser): Promise<void> {
    this.browser = browser;
    this.startTime = new Date();

    // Create browser context with video/screenshot settings
    this.context = await browser.newContext({
      recordVideo:
        this.parameters.video === 'on'
          ? { dir: './artifacts/videos' }
          : undefined,
      viewport: { width: 1920, height: 1080 },
      ignoreHTTPSErrors: true,
    });

    // Create new page
    this.page = await this.context.newPage();

    // Set default timeout
    this.page.setDefaultTimeout(30000);
    this.page.setDefaultNavigationTimeout(30000);
  }

  /**
   * Cleanup after scenario
   */
  async cleanup(): Promise<void> {
    if (this.page) {
      await this.page.close();
    }
    if (this.context) {
      await this.context.close();
    }
  }

  /**
   * Store data for use between steps
   */
  setData(key: string, value: unknown): void {
    this.testData[key] = value;
  }

  /**
   * Retrieve stored data
   */
  getData<T>(key: string): T | undefined {
    return this.testData[key] as T;
  }

  /**
   * Get elapsed time since scenario start
   */
  getElapsedTime(): number {
    return Date.now() - this.startTime.getTime();
  }
}

setWorldConstructor(CustomWorld);
