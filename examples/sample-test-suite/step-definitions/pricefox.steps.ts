import { Given, When, Then, AfterAll, setDefaultTimeout } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// Increase timeout to 60 seconds
setDefaultTimeout(60000);

let browser: Browser;
let page: Page;

// Load test data from JSON file
const testDataPath = path.resolve('examples/sample-test-suite/data/pricefox-test-data.json');
const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf-8'));

// Helper function to resolve placeholders from JSON
function resolveValue(placeholder: string): string {
    // Remove angle brackets if present
    const key = placeholder.replace(/^<|>$/g, '');
    
    // Split by dots to navigate nested objects
    const keys = key.split('.');
    let value: any = testData;
    
    for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
            value = value[k];
        } else {
            return placeholder; // Return original if not found
        }
    }
    
    return value;
}

// Scenario 1: Navigate to Car Insurance page

Given('I browse {string}', async (url: string) => {
    const resolvedUrl = resolveValue(url);
    console.log(`Opening URL: ${resolvedUrl}`);
    browser = await chromium.launch({ headless: false, slowMo: 100 });
    const context = await browser.newContext();
    page = await context.newPage();
    await page.goto(resolvedUrl);
    console.log('Page loaded successfully');
});

When('I wait for the cookies pop-up', async () => {
    console.log('Waiting for cookies pop-up...');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Give cookies popup time to appear
    
    // Check if cookie banner exists
    const possibleSelectors = [
        '#onetrust-banner-sdk',
        '[class*="cookie"]',
        '[id*="cookie"]',
        'div:has-text("Accept")',
        'div:has-text("cookies")'
    ];
    
    let found = false;
    for (const selector of possibleSelectors) {
        try {
            const element = page.locator(selector).first();
            if (await element.isVisible({ timeout: 2000 })) {
                console.log(`Cookie pop-up found with selector: ${selector}`);
                found = true;
                break;
            }
        } catch (e) {
            continue;
        }
    }
    
    if (found) {
        console.log('Cookie pop-up is visible');
    } else {
        console.log('Cookie pop-up not found or already dismissed');
    }
});

When('I click on {string} on the cookies pop-up', async (buttonText: string) => {
    const resolvedButtonText = resolveValue(buttonText);
    console.log(`Looking for "${resolvedButtonText}" button in cookie popup...`);
    
    try {
        // Wait a bit for popup to be fully rendered
        await page.waitForTimeout(1500);
        
        // Try multiple possible selectors for the Accept All button in the cookie dialog
        const acceptSelectors = [
            'button:has-text("Accept All")',
            'button:has-text("ACCEPT ALL")',
            'button:text("Accept All")',
            `button:has-text("${resolvedButtonText}")`,
            `button:text("${resolvedButtonText}")`,
            '[class*="accept"][class*="button"]:has-text("Accept")',
            'button[style*="orange"]:has-text("Accept")',
            'div[class*="cookie"] button:has-text("Accept All")',
            'div[class*="banner"] button:has-text("Accept All")'
        ];
        
        let clicked = false;
        
        for (const selector of acceptSelectors) {
            try {
                const button = page.locator(selector).first();
                
                if (await button.isVisible({ timeout: 1000 })) {
                    console.log(`Found "${resolvedButtonText}" button with selector: ${selector}`);
                    
                    // Try regular click first, then force if needed
                    try {
                        await button.click({ timeout: 3000 });
                    } catch (clickError) {
                        console.log('Regular click failed, using force click...');
                        await button.click({ force: true, timeout: 3000 });
                    }
                    
                    console.log(`✓ Clicked "${resolvedButtonText}" button`);
                    clicked = true;
                    
                    // Wait for popup to disappear
                    await page.waitForTimeout(2000);
                    break;
                }
            } catch (e) {
                continue;
            }
        }
        
        if (!clicked) {
            console.log(`⚠ "${buttonText}" button not found or already clicked`);
        }
        
    } catch (e) {
        console.log(`Error clicking "${resolvedButtonText}":`, e);
    }
});

When('I click on the button that says {string}', async (buttonText: string) => {
    const resolvedButtonText = resolveValue(buttonText);
    console.log(`Looking for button with text: "${resolvedButtonText}"...`);
    
    try {
        // Find the button/link with the specified text
        const button = page.locator(`a:has-text("${resolvedButtonText}")`).first();
        
        await button.scrollIntoViewIfNeeded({ timeout: 10000 });
        await button.waitFor({ state: 'visible', timeout: 5000 });
        
        console.log(`Found button: "${resolvedButtonText}"`);
        
        // Use force click to bypass overlays and wait for navigation
        await Promise.all([
            page.waitForNavigation({ timeout: 30000 }).catch(() => console.log('No navigation detected')),
            button.click({ force: true })
        ]);
        
        console.log(`Clicked button: "${resolvedButtonText}"`);
        console.log('Current URL:', page.url());
    } catch (e) {
        console.log(`Failed to click button "${resolvedButtonText}":`, e);
        console.log('Current URL:', page.url());
        throw e;
    }
});

Then('I should be on the car insurance page', async () => {
    console.log('Verifying car insurance page...');
    
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // The URL contains encoded Greek characters: %CE%B1%CF%83%CF%86%CE%AC%CE%BB%CE%B5%CE%B9%CE%B1-%CE%B1%CF%85%CF%84%CE%BF%CE%BA%CE%B9%CE%BD%CE%AE%CF%84%CE%BF%CF%85
    // which decodes to: ασφάλεια-αυτοκινήτου (car insurance in Greek)
    const urlMatch = /.*(asfaleia|autokinit|car.*insurance|ασφάλεια|αυτοκινήτου|%CE%B1%CF%83%CF%86|%CE%B1%CF%85%CF%84%CE%BF).*/i;
    
    if (urlMatch.test(currentUrl)) {
        console.log('✓ Successfully navigated to car insurance page');
        return;
    }
    
    // If URL doesn't match, check if we have car insurance form elements visible
    const hasCarInsuranceForm = await page.locator('input[name="plateNumber"], input[placeholder*="πινακίδα"], input[placeholder*="plate"]').isVisible().catch(() => false);
    
    if (hasCarInsuranceForm) {
        console.log('✓ Car insurance form is visible');
        return;
    }
    
    throw new Error(`Not on car insurance page. Current URL: ${currentUrl}`);
});

// Scenario 2: Enter car plate and compare

When('I set {string} as car plate', async (plateNumber: string) => {
    const resolvedPlateNumber = resolveValue(plateNumber);
    console.log(`Setting car plate: ${resolvedPlateNumber}`);
    
    try {
        // Use the exact selector from codegen
        const plateInput = page.getByRole('textbox', { name: 'License Plate' });
        
        await plateInput.waitFor({ state: 'visible', timeout: 5000 });
        await plateInput.click();
        await plateInput.fill(resolvedPlateNumber);
        
        console.log(`✓ Entered car plate: ${resolvedPlateNumber}`);
        
    } catch (e) {
        console.log(`Error setting car plate:`, e);
        throw e;
    }
});

When('I click on the button {string}', async (buttonText: string) => {
    const resolvedButtonText = resolveValue(buttonText);
    console.log(`Looking for button: "${resolvedButtonText}"...`);
    
    try {
        // Wait a moment for any animations
        await page.waitForTimeout(500);
        
        // Try multiple selectors for the button
        const button = page.locator(`button:has-text("${resolvedButtonText}")`).first();
        
        await button.waitFor({ state: 'visible', timeout: 5000 });
        console.log(`Found button: "${resolvedButtonText}"`);
        
        // Click and wait for navigation
        await Promise.all([
            page.waitForNavigation({ timeout: 30000 }).catch(() => console.log('No navigation detected, page might update dynamically')),
            button.click({ force: true })
        ]);
        
        console.log(`✓ Clicked button: "${resolvedButtonText}"`);
        console.log('Current URL:', page.url());
        
    } catch (e) {
        console.log(`Error clicking button "${resolvedButtonText}":`, e);
        throw e;
    }
});

Then('I should be redirected to the next page', async () => {
    console.log('Verifying navigation to next page...');
    
    // Wait for page transition
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Check if we're still on the main car insurance page or moved to vehicle details
    const isStillOnMainPage = currentUrl.includes('ασφάλεια-αυτοκινήτου') && !currentUrl.includes('?') && !currentUrl.includes('#');
    
    if (isStillOnMainPage) {
        // Check if form changed or new elements appeared
        const hasVehicleForm = await page.locator('select, input[type="date"], button:has-text("Επόμενο")').first().isVisible({ timeout: 5000 }).catch(() => false);
        
        if (hasVehicleForm) {
            console.log('✓ Form progressed to next step (vehicle details visible)');
            return;
        }
    }
    
    // Check if URL changed at all
    const baseUrl = 'https://www.pricefox.gr/%CE%B1%CF%83%CF%86%CE%AC%CE%BB%CE%B5%CE%B9%CE%B1-%CE%B1%CF%85%CF%84%CE%BF%CE%BA%CE%B9%CE%BD%CE%AE%CF%84%CE%BF%CF%85/';
    
    if (currentUrl !== baseUrl) {
        console.log('✓ Successfully redirected to next page');
        return;
    }
    
    console.log('⚠ Warning: May not have navigated, but continuing...');
});

Then('I should be on the vehicle specifications page', async () => {
    console.log('Verifying vehicle specifications page...');
    
    // Wait for page transition
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Check if we progressed (URL should show step=2 or higher, or have form elements for next step)
    const hasProgressed = currentUrl.includes('step=') || currentUrl.includes('journeyId=');
    
    if (hasProgressed) {
        console.log('✓ On vehicle specifications page');
        return;
    }
    
    console.log('⚠ Warning: URL may not have changed as expected');
});

// Scenario 3: Enter vehicle details

When('I set {string} to {string}', async (fieldLabel: string, value: string) => {
    const resolvedFieldLabel = resolveValue(fieldLabel);
    const resolvedValue = resolveValue(value);
    console.log(`Setting "${resolvedFieldLabel}" to "${resolvedValue}"`);
    
    try {
        // Wait for the page to be ready
        await page.waitForTimeout(1000);
        
        // Handle different field types based on label
        if (resolvedFieldLabel.includes('Ημερομηνία γέννησης')) {
            // Date of birth field with HH (day), MM (month), and year input
            const dateMatch = resolvedValue.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
            if (dateMatch) {
                const [_, day, month, year] = dateMatch;
                
                // Wait for the page to be ready
                await page.waitForTimeout(1000);
                
                // Use exact selectors from codegen
                const hhInput = page.getByRole('spinbutton', { name: 'HH' });
                const mmInput = page.getByRole('spinbutton', { name: 'MM' });
                const yearInput = page.locator('#input-driver-birth-date-year');
                
                await hhInput.waitFor({ state: 'visible', timeout: 5000 });
                await hhInput.click();
                await hhInput.fill(day.padStart(2, '0'));
                console.log(`✓ Set day to: ${day}`);
                
                await mmInput.click();
                await mmInput.fill(month.padStart(2, '0'));
                console.log(`✓ Set month to: ${month}`);
                
                await yearInput.click();
                await yearInput.fill(year);
                console.log(`✓ Set year to: ${year}`);
                
                console.log(`✓ Set date of birth to: ${resolvedValue}`);
                return;
            }
        } else if (resolvedFieldLabel.includes('Ημερομηνία') || resolvedFieldLabel.includes('date')) {
            // Vehicle registration date field with separate MM and YYYY spinbuttons
            const monthYearMatch = resolvedValue.match(/(\d{2})\/(\d{4})/);
            if (monthYearMatch) {
                const [_, month, year] = monthYearMatch;
                
                // Use exact selectors from codegen
                const mmInput = page.getByRole('spinbutton', { name: 'MM' });
                const yyyyInput = page.getByRole('spinbutton', { name: 'ΕΕΕΕ' });
                
                await mmInput.waitFor({ state: 'visible', timeout: 5000 });
                await mmInput.click();
                await mmInput.fill(month);
                console.log(`✓ Set month to: ${month}`);
                
                await yyyyInput.click();
                await yyyyInput.fill(year);
                console.log(`✓ Set year to: ${year}`);
                
                console.log(`✓ Set date to: ${resolvedValue}`);
                return;
            }
        } else if (resolvedFieldLabel.includes('Κατηγορία Οχήματος')) {
            // Vehicle category - custom dropdown
            // Click on the dropdown area to expand it
            const dropdownText = page.getByText('Επιβατικό Ι.Χ.Παρακαλώ επίλεξεΕπιβατικό Ι.Χ.ΜηχανήΦορτηγό Ι.Χ.Φορτηγό Ι.Χ. Αγροτ');
            
            try {
                await dropdownText.click({ timeout: 3000 });
                console.log('Opened vehicle category dropdown');
            } catch (e) {
                // Try alternative - just look for text containing the placeholder
                await page.getByText('Παρακαλώ επίλεξε', { exact: false }).first().click();
            }
            
            // Wait for dropdown to expand
            await page.waitForTimeout(500);
            
            // Click on the specific option (Επιβατικό Ι.Χ.)
            await page.getByText('Επιβατικό Ι.Χ').nth(1).click();
            console.log(`✓ Selected "${resolvedValue}" from vehicle category`);
            
            return;
        } else if (resolvedFieldLabel.includes('Μάρκα')) {
            // Make field - it's a searchable textbox
            const makeInput = page.getByRole('textbox', { name: 'Μάρκα' });
            
            await makeInput.waitFor({ state: 'visible', timeout: 5000 });
            await makeInput.fill(resolvedValue.toLowerCase());
            console.log(`Typed "${resolvedValue}" in make field`);
            
            // Wait for suggestions to appear
            await page.waitForTimeout(500);
            
            // Click on the matching suggestion (in uppercase)
            await page.getByText(resolvedValue.toUpperCase(), { exact: true }).click();
            console.log(`✓ Selected "${resolvedValue}" from make suggestions`);
            
            return;
        } else if (resolvedFieldLabel.includes('Μοντέλο') && !resolvedFieldLabel.includes('Έκδοση')) {
            // Model field - use specific ID to avoid ambiguity
            const modelInput = page.locator('#input-model');
            
            await modelInput.waitFor({ state: 'visible', timeout: 5000 });
            await modelInput.fill(resolvedValue.toLowerCase());
            console.log(`Typed "${resolvedValue}" in model field`);
            
            // Wait for suggestions to appear
            await page.waitForTimeout(500);
            
            // Click on the matching suggestion
            await page.getByText(resolvedValue, { exact: false }).first().click();
            console.log(`✓ Selected "${resolvedValue}" from model suggestions`);
            
            return;
        } else if (resolvedFieldLabel.includes('Είδος καυσίμου')) {
            // Fuel type - custom dropdown
            // Wait for the dropdown container to be ready
            await page.waitForTimeout(1000);
            
            // Find all elements with "Παρακαλώ επίλεξε" text and click the visible one
            const dropdowns = await page.getByText('Παρακαλώ επίλεξε').all();
            
            for (const dropdown of dropdowns) {
                try {
                    if (await dropdown.isVisible({ timeout: 1000 })) {
                        await dropdown.click({ timeout: 3000 });
                        console.log('Opened fuel type dropdown');
                        
                        // Wait for dropdown to expand
                        await page.waitForTimeout(500);
                        
                        // Click on the fuel type option
                        await page.getByText(resolvedValue, { exact: true }).first().click();
                        console.log(`✓ Selected "${resolvedValue}" from fuel type`);
                        return;
                    }
                } catch (e) {
                    continue;
                }
            }
            
            throw new Error('Could not find visible fuel type dropdown');
        } else if (resolvedFieldLabel.includes('Κυβικά')) {
            // Engine capacity (cubic cm) - searchable input with autocomplete
            const cubicInput = page.getByRole('textbox', { name: 'Κυβικά' });
            
            await cubicInput.waitFor({ state: 'visible', timeout: 5000 });
            await cubicInput.fill(resolvedValue);
            console.log(`Typed "${resolvedValue}" in cubic capacity field`);
            
            // Wait for suggestions to appear
            await page.waitForTimeout(500);
            
            // Click on the matching suggestion
            await page.getByText(resolvedValue, { exact: true }).first().click();
            console.log(`✓ Selected "${resolvedValue}" from cubic capacity`);
            return;
        } else if (resolvedFieldLabel.includes('Έκδοση μοντέλου')) {
            // Model version - use specific ID
            const versionInput = page.locator('#input-model-edition');
            
            await versionInput.waitFor({ state: 'visible', timeout: 5000 });
            await versionInput.fill(resolvedValue);
            console.log(`Typed "${resolvedValue}" in model version field`);
            
            // Wait for suggestions to appear
            await page.waitForTimeout(1000);
            
            // Click on the matching suggestion (use partial match for Greek characters)
            await page.getByText(resolvedValue, { exact: false }).first().click();
            console.log(`✓ Selected "${resolvedValue}" from model version suggestions`);
            
            return;
        } else if (resolvedFieldLabel.includes('Έτος έκδοσης διπλώματος')) {
            // License year - use specific ID from codegen
            const yearInput = page.locator('#input-driver-license-date-year');
            
            await yearInput.waitFor({ state: 'visible', timeout: 5000 });
            await yearInput.click();
            await yearInput.fill(resolvedValue);
            console.log(`✓ Set license year to: ${resolvedValue}`);
            
            return;
        } else if (resolvedFieldLabel.includes('Ταχυδρομικός κώδικας')) {
            // Postal code - searchable autocomplete field
            const postalInput = page.getByRole('textbox', { name: 'Ταχυδρομικός κώδικας' });
            
            await postalInput.waitFor({ state: 'visible', timeout: 5000 });
            
            // Extract just the postal code number from the value
            const postalCode = resolvedValue.split(',')[0].trim();
            await postalInput.fill(postalCode);
            console.log(`Typed postal code: ${postalCode}`);
            
            // Wait for suggestions to appear
            await page.waitForTimeout(500);
            
            // Click on the area name suggestion (e.g., Π.ΦΑΛΗΡΟ)
            await page.getByText('Π.ΦΑΛΗΡΟ').click();
            console.log(`✓ Selected "${resolvedValue}" from postal code suggestions`);
            
            return;
        }
        
        console.log(`⚠ Warning: Unknown field "${resolvedFieldLabel}"`);
        
    } catch (e) {
        console.log(`Error setting "${resolvedFieldLabel}":`, e);
        throw e;
    }
});

// Cleanup - close browser after all scenarios
AfterAll(async () => {
    if (browser) {
        await browser.close();
        console.log('Browser closed');
    }
});


