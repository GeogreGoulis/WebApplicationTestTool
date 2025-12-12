import { Cli } from '@cucumber/cucumber';
import { chromium, firefox, webkit, Browser, Page, BrowserContext } from 'playwright';
import { promises as fs } from 'fs';
import path from 'path';
import { createLogger } from '@watt/shared-utils';

const logger = createLogger('cucumber-executor');

interface CucumberExecutionConfig {
  featurePath: string;
  browserType: 'chrome' | 'chromium' | 'firefox' | 'webkit';
  headless: boolean;
  baseUrl?: string;
  timeout?: number;
  outputDir: string;
}

interface CucumberExecutionResult {
  success: boolean;
  duration: number;
  scenarios: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  features: {
    total: number;
    passed: number;
    failed: number;
  };
  steps: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    pending: number;
  };
  artifacts: {
    screenshots: string[];
    videos: string[];
    reports: string[];
  };
  errorMessage?: string;
}

export class CucumberExecutor {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  async execute(config: CucumberExecutionConfig): Promise<CucumberExecutionResult> {
    const startTime = Date.now();
    const screenshots: string[] = [];
    const videos: string[] = [];
    const reports: string[] = [];

    try {
      logger.info('Starting Cucumber execution', {
        featurePath: config.featurePath,
        browserType: config.browserType,
      });

      // Initialize browser
      await this.initializeBrowser(config);

      // Ensure output directory exists
      await fs.mkdir(config.outputDir, { recursive: true });

      // Set up Cucumber configuration
      const cucumberConfig = this.buildCucumberConfig(config);

      // Create world parameters for Cucumber
      const worldParameters = {
        browser: this.browser,
        context: this.context,
        page: this.page,
        baseUrl: config.baseUrl || '',
        outputDir: config.outputDir,
        screenshots,
        videos,
      };

      // Save world parameters to a temp file for Cucumber to access
      const worldParamsPath = path.join(config.outputDir, 'world-params.json');
      await fs.writeFile(worldParamsPath, JSON.stringify(worldParameters, null, 2));

      // Run Cucumber
      const exitCode = await this.runCucumber(cucumberConfig);

      // Parse Cucumber results
      const result = await this.parseResults(config.outputDir, exitCode);

      // Add artifacts
      result.artifacts = {
        screenshots,
        videos,
        reports,
      };

      result.duration = Date.now() - startTime;
      result.success = exitCode === 0;

      logger.info('Cucumber execution completed', {
        success: result.success,
        duration: result.duration,
        scenarios: result.scenarios,
      });

      return result;
    } catch (error: any) {
      logger.error('Cucumber execution failed', { error: error.message });

      return {
        success: false,
        duration: Date.now() - startTime,
        scenarios: { total: 0, passed: 0, failed: 1, skipped: 0 },
        features: { total: 0, passed: 0, failed: 1 },
        steps: { total: 0, passed: 0, failed: 0, skipped: 0, pending: 0 },
        artifacts: { screenshots, videos, reports },
        errorMessage: error.message,
      };
    } finally {
      await this.cleanup();
    }
  }

  private async initializeBrowser(config: CucumberExecutionConfig): Promise<void> {
    logger.info('Initializing browser', { browserType: config.browserType });

    const browserOptions = {
      headless: config.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    };

    // Launch browser based on type
    switch (config.browserType) {
      case 'chrome':
      case 'chromium':
        this.browser = await chromium.launch(browserOptions);
        break;
      case 'firefox':
        this.browser = await firefox.launch(browserOptions);
        break;
      case 'webkit':
        this.browser = await webkit.launch(browserOptions);
        break;
      default:
        throw new Error(`Unsupported browser type: ${config.browserType}`);
    }

    // Create context with video recording
    const contextOptions: any = {
      viewport: { width: 1920, height: 1080 },
      recordVideo: {
        dir: config.outputDir,
        size: { width: 1920, height: 1080 },
      },
    };

    this.context = await this.browser.newContext(contextOptions);
    this.page = await this.context.newPage();

    // Set default timeout
    this.page.setDefaultTimeout(config.timeout || 30000);
  }

  private buildCucumberConfig(config: CucumberExecutionConfig): string[] {
    const args = [
      config.featurePath,
      '--require-module', 'ts-node/register',
      '--require', path.join(__dirname, '../cucumber-support/step-definitions/**/*.ts'),
      '--require', path.join(__dirname, '../cucumber-support/hooks.ts'),
      '--format', 'json:' + path.join(config.outputDir, 'cucumber-report.json'),
      '--format', 'html:' + path.join(config.outputDir, 'cucumber-report.html'),
      '--format', 'progress',
      '--publish-quiet',
    ];

    return args;
  }

  private async runCucumber(args: string[]): Promise<number> {
    logger.info('Running Cucumber CLI', { args });

    try {
      const cli = new Cli({
        argv: ['node', 'cucumber-js', ...args],
        cwd: process.cwd(),
        stdout: process.stdout,
      });

      const result = await cli.run();
      return result.success ? 0 : 1;
    } catch (error: any) {
      logger.error('Cucumber CLI execution failed', { error: error.message });
      return 1;
    }
  }

  private async parseResults(
    outputDir: string,
    exitCode: number
  ): Promise<CucumberExecutionResult> {
    try {
      const reportPath = path.join(outputDir, 'cucumber-report.json');
      const reportContent = await fs.readFile(reportPath, 'utf-8');
      const report = JSON.parse(reportContent);

      let totalScenarios = 0;
      let passedScenarios = 0;
      let failedScenarios = 0;
      let skippedScenarios = 0;

      let totalFeatures = 0;
      let passedFeatures = 0;
      let failedFeatures = 0;

      let totalSteps = 0;
      let passedSteps = 0;
      let failedSteps = 0;
      let skippedSteps = 0;
      let pendingSteps = 0;

      // Parse Cucumber JSON report
      if (Array.isArray(report)) {
        totalFeatures = report.length;

        for (const feature of report) {
          let featurePassed = true;

          if (feature.elements) {
            for (const scenario of feature.elements) {
              totalScenarios++;
              let scenarioPassed = true;

              if (scenario.steps) {
                for (const step of scenario.steps) {
                  totalSteps++;

                  if (step.result) {
                    switch (step.result.status) {
                      case 'passed':
                        passedSteps++;
                        break;
                      case 'failed':
                        failedSteps++;
                        scenarioPassed = false;
                        featurePassed = false;
                        break;
                      case 'skipped':
                        skippedSteps++;
                        break;
                      case 'pending':
                      case 'undefined':
                        pendingSteps++;
                        scenarioPassed = false;
                        featurePassed = false;
                        break;
                    }
                  }
                }
              }

              if (scenarioPassed) {
                passedScenarios++;
              } else if (skippedSteps > 0 && failedSteps === 0) {
                skippedScenarios++;
              } else {
                failedScenarios++;
              }
            }
          }

          if (featurePassed) {
            passedFeatures++;
          } else {
            failedFeatures++;
          }
        }
      }

      return {
        success: exitCode === 0,
        duration: 0,
        scenarios: {
          total: totalScenarios,
          passed: passedScenarios,
          failed: failedScenarios,
          skipped: skippedScenarios,
        },
        features: {
          total: totalFeatures,
          passed: passedFeatures,
          failed: failedFeatures,
        },
        steps: {
          total: totalSteps,
          passed: passedSteps,
          failed: failedSteps,
          skipped: skippedSteps,
          pending: pendingSteps,
        },
        artifacts: {
          screenshots: [],
          videos: [],
          reports: [],
        },
      };
    } catch (error: any) {
      logger.error('Failed to parse Cucumber results', { error: error.message });

      return {
        success: exitCode === 0,
        duration: 0,
        scenarios: { total: 0, passed: 0, failed: 0, skipped: 0 },
        features: { total: 0, passed: 0, failed: 0 },
        steps: { total: 0, passed: 0, failed: 0, skipped: 0, pending: 0 },
        artifacts: { screenshots: [], videos: [], reports: [] },
      };
    }
  }

  private async cleanup(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
      }
      if (this.context) {
        await this.context.close();
      }
      if (this.browser) {
        await this.browser.close();
      }
    } catch (error: any) {
      logger.error('Cleanup failed', { error: error.message });
    }
  }

  // Get page for use in step definitions
  getPage(): Page | null {
    return this.page;
  }

  // Get context for use in step definitions
  getContext(): BrowserContext | null {
    return this.context;
  }

  // Get browser for use in step definitions
  getBrowser(): Browser | null {
    return this.browser;
  }
}
