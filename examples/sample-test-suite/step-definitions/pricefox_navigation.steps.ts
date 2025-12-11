import { Given, When, Then, AfterAll, setDefaultTimeout } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { chromium, Browser, Page } from 'playwright';

// Increase timeout to 60 seconds
setDefaultTimeout(60000);

let browser: Browser;
let page: Page;

// ---------- Navigation & Common ----------

Given('I open the Pricefox homepage', async () => {
    browser = await chromium.launch({ headless: false, slowMo: 100 });
    const context = await browser.newContext();
    page = await context.newPage();
    await page.goto('https://www.pricefox.gr');
    console.log('Homepage loaded');
});

When('I accept all cookies if prompted', async () => {
    // Strict sequential flow: Wait for banner -> Accept -> Wait for disappear
    console.log('Waiting for cookie banner...');
    
    // OneTrust banner selector
    const banner = page.locator('#onetrust-banner-sdk');
    
    try {
        await banner.waitFor({ state: 'visible', timeout: 15000 });
        console.log('Cookie banner visible');
        
        // Target specifically "Accept All" button (Greek: "Accept All" based on screenshot provided which shows English button text "Accept All")
        const acceptBtn = page.locator('#onetrust-accept-btn-handler')
            .or(page.getByRole('button', { name: 'Accept All' }))
            .or(page.getByText('Accept All'))
            .first();

        await acceptBtn.waitFor({ state: 'visible', timeout: 5000 });
        await acceptBtn.click();
        console.log('Clicked accept cookies');
        
        // Wait for it to be gone so it doesn't block the next click
        await banner.waitFor({ state: 'hidden', timeout: 10000 });
        console.log('Cookie banner disappeared');
        
    } catch (e) {
        console.log('Cookie banner flow skipped or timed out:', e);
    }
});

When('I click on "Ασφάλεια Αυτοκινήτου" icon', async () => {
    console.log('Looking for Car Insurance button...');
    
    // Switch to visible text matching as hrefs can trigger timeouts or be hidden
    // We want the one that the user sees.
    const link = page.getByText('Ασφάλεια Αυτοκινήτου', { exact: false })
                     .locator('visible=true')
                     .first();
    
    try {
        await link.scrollIntoViewIfNeeded({ timeout: 10000 });
        await link.waitFor({ state: 'visible', timeout: 5000 });
        
        // Use force click if standard click is blocked by invisible overlays
        await link.click({ force: true });
        console.log('Clicked Car Insurance button');
    } catch (e) {
        console.log('Failed to click button, debugging...');
        // Log what we see to help debug
        const links = await page.locator('a').allInnerTexts();
        console.log('Visible links found:', links.slice(0, 10)); // Log first 10 links
        throw e;
    }
});

Then('I should be on the car insurance page', async () => {
    console.log('Verifying URL...');
    // Decode URL to handle Greek characters vs encoded strings
    // Expected path is likely /ασφάλεια-αυτοκινήτου/ or similar
    await expect(page).toHaveURL(/.*(asfaleia-autokinitou|ασφάλεια-αυτοκινήτου|%CE%B1%CF%83%CF%86%CE%AC%CE%BB%CE%B5%CE%B9%CE%B1-%CE%B1%CF%85%CF%84%CE%BF%CE%BA%CE%B9%CE%BD%CE%AE%CF%84%CE%BF%CF%85).*/, { timeout: 20000 });
    console.log('URL verified');
});

// ---------- Car Plate ----------

When('I enter car plate {string}', async (plate: string) => {
    console.log(`Entering car plate: ${plate}`);
    // Wait for the input to be ready
    const plateInput = page.locator('input[name="plateNumber"], input[placeholder*="πινακίδα"]');
    await plateInput.waitFor({ state: 'visible', timeout: 10000 });
    await plateInput.fill(plate);
    
    // User specified "Σύγκρινε τώρα" button
    const compareButton = page.locator('button', { hasText: 'Σύγκρινε τώρα' })
        .or(page.getByRole('button', { name: 'Σύγκρινε τώρα' }))
        .first();
        
    await compareButton.waitFor({ state: 'visible', timeout: 5000 });
    await compareButton.click();
    console.log('Clicked Compare Now');
});

Then('I should be redirected to the next step', async () => {
    // Verify we are moving forward - checking for url change or vehicle type selector appearing
    console.log('Verifying transition to Vehicle Details...');
    // Next step usually involves selecting vehicle type or make
    // Look for common text/elements of the next screen
    // e.g. "Επιβατικό ΙΧ", "Μάρκα", etc.
    const vehicleTypeSelector = page.getByText('Επιβατικό ΙΧ').first();
    try {
        await vehicleTypeSelector.waitFor({ state: 'visible', timeout: 20000 });
        console.log('Successfully transitioned to Vehicle Details step');
    } catch (e) {
        console.log('Transition verification failed. Current URL:', page.url());
        throw e;
    }
});

AfterAll(async () => {
    // Keep browser open for debugging if needed, or close
    if (browser) await browser.close();
});
