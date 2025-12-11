import { Given, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { chromium } from 'playwright';

let browser: any;
let page: any;

Given('I open the URL {string}', async (url: string) => {
    browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    page = await context.newPage();
    await page.goto(url);
});

Then('the page title should contain {string}', async (expected: string) => {
    const title = await page.title();
    expect(title).toContain(expected);
    await browser.close();
});
