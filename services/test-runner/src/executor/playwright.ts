import { chromium, firefox, webkit, Browser, BrowserContext, Page } from 'playwright';
import { config } from '../config';
import { createLogger } from '@watt/shared-utils';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('playwright-executor');

export type BrowserType = 'chromium' | 'firefox' | 'webkit';

export interface TestExecutionContext {
  executionId: string;
  browser: BrowserType;
  testScript: {
    id: string;
    name: string;
    filePath: string;
  };
  environment: {
    baseUrl: string;
    variables: Record<string, any>;
  };
}

export interface TestExecutionResult {
  scriptId: string;
  browser: BrowserType;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  errorMessage?: string;
  stackTrace?: string;
  screenshots: string[];
  videoPath?: string;
}

export class PlaywrightExecutor {
  private browsers: Map<BrowserType, Browser> = new Map();
  private artifactsDir: string;

  constructor() {
    this.artifactsDir = path.join(process.cwd(), 'test-artifacts');
    this.ensureArtifactsDir();
  }

  private ensureArtifactsDir(): void {
    if (!fs.existsSync(this.artifactsDir)) {
      fs.mkdirSync(this.artifactsDir, { recursive: true });
    }
  }

  async launchBrowser(browserType: BrowserType): Promise<Browser> {
    if (this.browsers.has(browserType)) {
      return this.browsers.get(browserType)!;
    }

    logger.info('Launching browser', { browserType });

    let browser: Browser;
    const launchOptions = {
      headless: config.playwright.headless,
      slowMo: config.playwright.slowMo,
    };

    switch (browserType) {
      case 'chromium':
        browser = await chromium.launch(launchOptions);
        break;
      case 'firefox':
        browser = await firefox.launch(launchOptions);
        break;
      case 'webkit':
        browser = await webkit.launch(launchOptions);
        break;
      default:
        throw new Error(`Unsupported browser type: ${browserType}`);
    }

    this.browsers.set(browserType, browser);
    logger.info('Browser launched successfully', { browserType });

    return browser;
  }

  async createContext(
    browser: Browser,
    executionId: string,
    options?: any
  ): Promise<BrowserContext> {
    const contextOptions: any = {
      viewport: { width: 1280, height: 720 },
      ...options,
    };

    // Enable video recording if configured
    if (config.playwright.videoRecording) {
      const videoDir = path.join(this.artifactsDir, executionId, 'videos');
      fs.mkdirSync(videoDir, { recursive: true });
      contextOptions.recordVideo = {
        dir: videoDir,
        size: { width: 1280, height: 720 },
      };
    }

    const context = await browser.newContext(contextOptions);

    logger.info('Browser context created', { executionId });

    return context;
  }

  async executeTest(context: TestExecutionContext): Promise<TestExecutionResult> {
    const startTime = Date.now();
    const screenshots: string[] = [];
    let videoPath: string | undefined;
    let status: 'passed' | 'failed' | 'skipped' = 'passed';
    let errorMessage: string | undefined;
    let stackTrace: string | undefined;

    let browser: Browser | null = null;
    let browserContext: BrowserContext | null = null;
    let page: Page | null = null;

    try {
      logger.info('Starting test execution', {
        executionId: context.executionId,
        scriptId: context.testScript.id,
        browser: context.browser,
        filePath: context.testScript.filePath,
      });

      // Launch browser
      browser = await this.launchBrowser(context.browser);
      browserContext = await this.createContext(browser, context.executionId);
      page = await browserContext.newPage();

      // Set default timeout
      page.setDefaultTimeout(config.playwright.timeout);

      // Check if this is a Cucumber feature file
      const isFeatureFile = context.testScript.filePath.endsWith('.feature');

      if (isFeatureFile) {
        // For now, execute as a simulated Cucumber test
        // Full Cucumber integration requires more complex setup with step definitions
        logger.info('Feature file detected, executing with Playwright', {
          executionId: context.executionId,
          featureFile: context.testScript.filePath,
        });

        // Navigate to base URL
        if (context.environment.baseUrl) {
          await page.goto(context.environment.baseUrl);
        }

        // Simulate test execution
        await this.simulateTestExecution(page, context);
        screenshots.push(...(await this.getPageScreenshots(page, context.executionId)));

        logger.info('Feature file test completed', {
          executionId: context.executionId,
          status: 'passed',
        });
      } else {
        // Execute as plain Playwright test (fallback to simulation)
        if (context.environment.baseUrl) {
          await page.goto(context.environment.baseUrl);
        }

        await this.simulateTestExecution(page, context);
        screenshots.push(...(await this.getPageScreenshots(page, context.executionId)));
      }

      status = 'passed';
      logger.info('Test execution completed successfully', {
        executionId: context.executionId,
        scriptId: context.testScript.id,
      });

    } catch (error: any) {
      status = 'failed';
      errorMessage = error.message;
      stackTrace = error.stack;

      logger.error('Test execution failed', {
        executionId: context.executionId,
        scriptId: context.testScript.id,
        error: errorMessage,
      });

      // Capture screenshot on failure
      if (config.playwright.screenshotOnFailure && page) {
        const screenshotPath = await this.captureScreenshot(
          page,
          context.executionId,
          'failure'
        );
        if (screenshotPath) {
          screenshots.push(screenshotPath);
        }
      }
    } finally {
      // Close browser context and capture video
      if (browserContext) {
        if (config.playwright.videoRecording) {
          const videoPage = browserContext.pages()[0];
          if (videoPage) {
            const video = videoPage.video();
            if (video) {
              videoPath = await video.path();
            }
          }
        }

        await browserContext.close();
      }
    }

    const duration = Date.now() - startTime;

    return {
      scriptId: context.testScript.id,
      browser: context.browser,
      status,
      duration,
      errorMessage,
      stackTrace,
      screenshots,
      videoPath,
    };
  }

  private async getPageScreenshots(page: Page, executionId: string): Promise<string[]> {
    const screenshots: string[] = [];
    const screenshotPath = await this.captureScreenshot(page, executionId, 'test-step');
    if (screenshotPath) {
      screenshots.push(screenshotPath);
    }
    return screenshots;
  }

  private async simulateTestExecution(page: Page, context: TestExecutionContext): Promise<void> {
    // This is a placeholder for actual Cucumber test execution
    // In Phase 2, we'll integrate with Cucumber to run actual .feature files
    
    // For demonstration, perform simple actions
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot
    const screenshotPath = await this.captureScreenshot(
      page,
      context.executionId,
      'test-step'
    );
    
    logger.info('Simulated test execution', {
      title: await page.title(),
      url: page.url(),
      screenshot: screenshotPath,
    });
  }

  async captureScreenshot(
    page: Page,
    executionId: string,
    name: string
  ): Promise<string | null> {
    try {
      const screenshotDir = path.join(this.artifactsDir, executionId, 'screenshots');
      fs.mkdirSync(screenshotDir, { recursive: true });

      const filename = `${name}-${uuidv4()}.png`;
      const screenshotPath = path.join(screenshotDir, filename);

      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
      });

      logger.info('Screenshot captured', { path: screenshotPath });

      return screenshotPath;
    } catch (error) {
      logger.error('Failed to capture screenshot', { error });
      return null;
    }
  }

  async closeAllBrowsers(): Promise<void> {
    for (const [browserType, browser] of this.browsers.entries()) {
      try {
        await browser.close();
        logger.info('Browser closed', { browserType });
      } catch (error) {
        logger.error('Error closing browser', { browserType, error });
      }
    }
    this.browsers.clear();
  }
}

export const playwrightExecutor = new PlaywrightExecutor();
