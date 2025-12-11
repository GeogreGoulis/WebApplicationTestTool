/**
 * WATT Sample Step Definitions
 *
 * This file demonstrates how to write step definitions for Cucumber + Playwright
 * Step definitions map Gherkin steps to actual browser automation code
 */

import { Given, When, Then, Before, After } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';
import { loadTestData } from '../support/data-loader';
import { LoginPage } from '../page-objects/LoginPage';

// ============================================
// HOOKS
// ============================================

Before(async function (this: CustomWorld) {
  // Initialize page objects before each scenario
  this.loginPage = new LoginPage(this.page);
});

After(async function (this: CustomWorld, scenario) {
  // Capture screenshot on failure
  if (scenario.result?.status === 'FAILED') {
    const screenshot = await this.page.screenshot({ fullPage: true });
    this.attach(screenshot, 'image/png');
  }
});

// ============================================
// GIVEN STEPS
// ============================================

Given('I am on the login page', async function (this: CustomWorld) {
  const baseUrl = loadTestData('environments.staging.baseUrl');
  await this.page.goto(`${baseUrl}/login`);
  await this.loginPage.waitForPageLoad();
});

Given('I clear any existing session', async function (this: CustomWorld) {
  await this.page.context().clearCookies();
  await this.page.evaluate(() => localStorage.clear());
});

Given('I am logged in as {string}', async function (this: CustomWorld, userDataPath: string) {
  const userData = loadTestData(userDataPath) as { email: string; password: string };
  const baseUrl = loadTestData('environments.staging.baseUrl') as string;

  await this.page.goto(`${baseUrl}/login`);
  await this.loginPage.login(userData.email, userData.password);
  await this.page.waitForURL('**/dashboard/**');
});

Given('I have failed login {int} times with {string}', async function (
  this: CustomWorld,
  attempts: number,
  emailPath: string
) {
  const email = loadTestData(emailPath) as string;
  const baseUrl = loadTestData('environments.staging.baseUrl') as string;

  for (let i = 0; i < attempts; i++) {
    await this.page.goto(`${baseUrl}/login`);
    await this.loginPage.login(email, 'wrongpassword');
    await this.page.waitForSelector('[data-testid="error-message"]');
  }
});

Given('my session has expired', async function (this: CustomWorld) {
  // Simulate session expiration by manipulating cookies
  await this.page.context().clearCookies();
});

// ============================================
// WHEN STEPS
// ============================================

When('I enter username {string}', async function (this: CustomWorld, value: string) {
  // Handle data references (e.g., "data:users.validUser.email")
  const actualValue = value.startsWith('data:')
    ? loadTestData(value.replace('data:', '')) as string
    : value;

  await this.loginPage.enterUsername(actualValue);
});

When('I enter password {string}', async function (this: CustomWorld, value: string) {
  const actualValue = value.startsWith('data:')
    ? loadTestData(value.replace('data:', '')) as string
    : value;

  await this.loginPage.enterPassword(actualValue);
});

When('I click the login button', async function (this: CustomWorld) {
  await this.loginPage.clickLoginButton();
});

When('I check the {string} checkbox', async function (this: CustomWorld, label: string) {
  await this.loginPage.checkRememberMe();
});

When('I leave the username field empty', async function (this: CustomWorld) {
  await this.loginPage.enterUsername('');
});

When('I leave the password field empty', async function (this: CustomWorld) {
  await this.loginPage.enterPassword('');
});

When('I try to access a protected page', async function (this: CustomWorld) {
  const baseUrl = loadTestData('environments.staging.baseUrl');
  await this.page.goto(`${baseUrl}/dashboard`);
});

// ============================================
// THEN STEPS
// ============================================

Then('I should be redirected to the dashboard', async function (this: CustomWorld) {
  await this.page.waitForURL('**/dashboard**', { timeout: 10000 });
  expect(this.page.url()).toContain('/dashboard');
});

Then('I should be redirected to {string}', async function (this: CustomWorld, expectedPath: string) {
  await this.page.waitForURL(`**${expectedPath}**`, { timeout: 10000 });
  expect(this.page.url()).toContain(expectedPath);
});

Then('I should be redirected to the login page', async function (this: CustomWorld) {
  await this.page.waitForURL('**/login**', { timeout: 10000 });
  expect(this.page.url()).toContain('/login');
});

Then('I should see welcome message containing {string}', async function (
  this: CustomWorld,
  value: string
) {
  const expectedText = value.startsWith('data:')
    ? loadTestData(value.replace('data:', ''))
    : value;

  const welcomeMessage = await this.page.locator('[data-testid="welcome-message"]').textContent();
  expect(welcomeMessage).toContain(expectedText);
});

Then('I should see the user avatar', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="user-avatar"]')).toBeVisible();
});

Then('I should see role indicator {string}', async function (this: CustomWorld, role: string) {
  const roleIndicator = await this.page.locator('[data-testid="role-indicator"]').textContent();
  expect(roleIndicator).toBe(role);
});

Then('I should see error message {string}', async function (this: CustomWorld, value: string) {
  const expectedMessage = value.startsWith('data:')
    ? loadTestData(value.replace('data:', ''))
    : value;

  const errorMessage = await this.loginPage.getErrorMessage();
  expect(errorMessage).toBe(expectedMessage);
});

Then('I should see message {string}', async function (this: CustomWorld, value: string) {
  const expectedMessage = value.startsWith('data:')
    ? loadTestData(value.replace('data:', ''))
    : value;

  const message = await this.page.locator('[data-testid="message"]').textContent();
  expect(message).toContain(expectedMessage);
});

Then('I should remain on the login page', async function (this: CustomWorld) {
  expect(this.page.url()).toContain('/login');
});

Then('the password field should be cleared', async function (this: CustomWorld) {
  const passwordValue = await this.loginPage.getPasswordFieldValue();
  expect(passwordValue).toBe('');
});

Then('the error message should not reveal if the email exists', async function (this: CustomWorld) {
  const errorMessage = await this.loginPage.getErrorMessage();
  // Error message should be generic
  expect(errorMessage).not.toContain('email not found');
  expect(errorMessage).not.toContain('user does not exist');
});

Then('a persistent session cookie should be created', async function (this: CustomWorld) {
  const cookies = await this.page.context().cookies();
  const sessionCookie = cookies.find(c => c.name === 'remember_token');
  expect(sessionCookie).toBeDefined();
  expect(sessionCookie?.expires).toBeGreaterThan(Date.now() / 1000 + 86400); // > 1 day
});

Then('the account should be locked for {string} minutes', async function (
  this: CustomWorld,
  value: string
) {
  const minutes = value.startsWith('data:')
    ? loadTestData(value.replace('data:', ''))
    : parseInt(value);

  // Verify lockout message mentions the duration
  const message = await this.loginPage.getErrorMessage();
  expect(message).toContain('locked');
});

Then('I should see warning about existing session', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="session-warning"]')).toBeVisible();
});

Then('I should be able to choose to continue or cancel', async function (this: CustomWorld) {
  await expect(this.page.locator('[data-testid="continue-session-btn"]')).toBeVisible();
  await expect(this.page.locator('[data-testid="cancel-session-btn"]')).toBeVisible();
});
