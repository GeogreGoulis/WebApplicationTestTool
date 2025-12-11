/**
 * Cucumber World - Base test context
 */

import { World, IWorldOptions } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page } from '@playwright/test';

export interface WattWorldOptions extends IWorldOptions {
  browser?: Browser;
  baseUrl?: string;
}

export class WattWorld extends World {
  public browser?: Browser;
  public context?: BrowserContext;
  public page?: Page;
  public baseUrl: string;

  constructor(options: WattWorldOptions) {
    super(options);
    this.browser = options.browser;
    this.baseUrl = options.baseUrl || process.env.BASE_URL || 'http://localhost:3000';
  }

  async init(): Promise<void> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();
  }

  async cleanup(): Promise<void> {
    if (this.page) {
      await this.page.close();
    }
    if (this.context) {
      await this.context.close();
    }
  }
}
