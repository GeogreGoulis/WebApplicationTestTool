/**
 * WATT Sample Page Object
 *
 * Page Object Model (POM) encapsulates page-specific selectors and actions
 * This improves maintainability and enables self-healing
 */

import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  // Locators with self-healing support (multiple selectors)
  readonly locators = {
    usernameInput: {
      primary: '#username',
      fallbacks: [
        'input[name="username"]',
        'input[type="email"]',
        '[data-testid="username-input"]',
        'input[placeholder*="email" i]',
      ],
      attributes: { role: 'textbox', name: /email|username/i },
    },
    passwordInput: {
      primary: '#password',
      fallbacks: [
        'input[name="password"]',
        'input[type="password"]',
        '[data-testid="password-input"]',
      ],
      attributes: { role: 'textbox', type: 'password' },
    },
    loginButton: {
      primary: '#login-btn',
      fallbacks: [
        'button[type="submit"]',
        '[data-testid="login-button"]',
        'button:has-text("Login")',
        'button:has-text("Sign In")',
      ],
      attributes: { role: 'button', name: /login|sign in/i },
    },
    rememberMeCheckbox: {
      primary: '#remember-me',
      fallbacks: [
        'input[name="remember"]',
        '[data-testid="remember-checkbox"]',
        'input[type="checkbox"]:near(:text("Remember"))',
      ],
    },
    errorMessage: {
      primary: '[data-testid="error-message"]',
      fallbacks: ['.error-message', '.alert-error', '[role="alert"]'],
    },
    welcomeMessage: {
      primary: '[data-testid="welcome-message"]',
      fallbacks: ['.welcome-message', 'h1:has-text("Welcome")'],
    },
  };

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Get a locator with self-healing support
   * Tries primary locator first, then fallbacks
   */
  private async getLocator(locatorConfig: {
    primary: string;
    fallbacks?: string[];
    attributes?: Record<string, unknown>;
  }): Promise<Locator> {
    // Try primary locator first
    const primaryLocator = this.page.locator(locatorConfig.primary);
    if ((await primaryLocator.count()) > 0) {
      return primaryLocator;
    }

    // Try fallbacks
    if (locatorConfig.fallbacks) {
      for (const fallback of locatorConfig.fallbacks) {
        const fallbackLocator = this.page.locator(fallback);
        if ((await fallbackLocator.count()) > 0) {
          console.log(
            `[Self-Healing] Element not found with "${locatorConfig.primary}", ` +
              `using fallback "${fallback}"`
          );
          return fallbackLocator;
        }
      }
    }

    // Try by attributes
    if (locatorConfig.attributes) {
      const attrLocator = this.page.getByRole(
        locatorConfig.attributes.role as Parameters<Page['getByRole']>[0],
        { name: locatorConfig.attributes.name as string | RegExp }
      );
      if ((await attrLocator.count()) > 0) {
        console.log(`[Self-Healing] Using role-based locator for "${locatorConfig.primary}"`);
        return attrLocator;
      }
    }

    // Return primary locator (will fail with clear error message)
    return primaryLocator;
  }

  // ============================================
  // PAGE ACTIONS
  // ============================================

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await expect(await this.getLocator(this.locators.usernameInput)).toBeVisible();
  }

  async enterUsername(username: string): Promise<void> {
    const input = await this.getLocator(this.locators.usernameInput);
    await input.clear();
    await input.fill(username);
  }

  async enterPassword(password: string): Promise<void> {
    const input = await this.getLocator(this.locators.passwordInput);
    await input.clear();
    await input.fill(password);
  }

  async clickLoginButton(): Promise<void> {
    const button = await this.getLocator(this.locators.loginButton);
    await button.click();
  }

  async checkRememberMe(): Promise<void> {
    const checkbox = await this.getLocator(this.locators.rememberMeCheckbox);
    await checkbox.check();
  }

  async login(username: string, password: string): Promise<void> {
    await this.enterUsername(username);
    await this.enterPassword(password);
    await this.clickLoginButton();
  }

  // ============================================
  // PAGE QUERIES
  // ============================================

  async getErrorMessage(): Promise<string | null> {
    const errorElement = await this.getLocator(this.locators.errorMessage);
    try {
      await errorElement.waitFor({ state: 'visible', timeout: 5000 });
      return await errorElement.textContent();
    } catch {
      return null;
    }
  }

  async getPasswordFieldValue(): Promise<string> {
    const input = await this.getLocator(this.locators.passwordInput);
    return await input.inputValue();
  }

  async isLoginButtonEnabled(): Promise<boolean> {
    const button = await this.getLocator(this.locators.loginButton);
    return await button.isEnabled();
  }

  async getWelcomeMessage(): Promise<string | null> {
    const element = await this.getLocator(this.locators.welcomeMessage);
    try {
      await element.waitFor({ state: 'visible', timeout: 5000 });
      return await element.textContent();
    } catch {
      return null;
    }
  }

  // ============================================
  // PAGE ASSERTIONS
  // ============================================

  async expectErrorVisible(expectedMessage?: string): Promise<void> {
    const errorElement = await this.getLocator(this.locators.errorMessage);
    await expect(errorElement).toBeVisible();
    if (expectedMessage) {
      await expect(errorElement).toContainText(expectedMessage);
    }
  }

  async expectOnLoginPage(): Promise<void> {
    expect(this.page.url()).toContain('/login');
    const usernameInput = await this.getLocator(this.locators.usernameInput);
    await expect(usernameInput).toBeVisible();
  }
}
