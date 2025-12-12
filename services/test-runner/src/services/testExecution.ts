import { PlaywrightExecutor, TestExecutionContext, TestExecutionResult } from '../executor/playwright';
import { MinioStorage } from '../storage/minio';
import { pool } from '../database';
import { createLogger } from '@watt/shared-utils';
import * as path from 'path';
import * as fs from 'fs';

const logger = createLogger('test-execution-service');

export interface ExecutionJob {
  id: string;
  type: string;
  suiteId: string;
  environmentId: string;
  browsers: ('chromium' | 'firefox' | 'webkit')[];
  parallelCount: number;
  scripts: Array<{
    id: string;
    name: string;
    filePath: string;
    framework: string;
    timeout: number;
    retryCount: number;
    tags: string[];
  }>;
  metadata: Record<string, any>;
  createdAt: string;
}

export class TestExecutionService {
  private playwrightExecutor: PlaywrightExecutor;
  private minioStorage: MinioStorage;
  private examplesPath: string;

  constructor() {
    this.playwrightExecutor = new PlaywrightExecutor();
    this.minioStorage = new MinioStorage();
    // Path to examples directory (mounted or copied into container)
    this.examplesPath = process.env.EXAMPLES_PATH || '/app/examples';
  }

  private resolveScriptPath(filePath: string): string {
    // If it's an absolute path and exists, use it
    if (path.isAbsolute(filePath) && fs.existsSync(filePath)) {
      return filePath;
    }

    // Check in examples directory
    const examplePath = path.join(this.examplesPath, filePath);
    if (fs.existsSync(examplePath)) {
      logger.info('Resolved script path in examples', { 
        original: filePath, 
        resolved: examplePath 
      });
      return examplePath;
    }

    // Check relative to sample-test-suite
    const sampleSuitePath = path.join(this.examplesPath, 'sample-test-suite', filePath);
    if (fs.existsSync(sampleSuitePath)) {
      logger.info('Resolved script path in sample-test-suite', {
        original: filePath,
        resolved: sampleSuitePath,
      });
      return sampleSuitePath;
    }

    // Return original path (will fail if doesn't exist)
    logger.warn('Could not resolve script path, using original', { path: filePath });
    return filePath;
  }

  async executeJob(job: ExecutionJob): Promise<void> {
    logger.info('Starting test execution job', { 
      executionId: job.id, 
      suiteId: job.suiteId,
      browsers: job.browsers,
      scriptCount: job.scripts.length 
    });

    try {
      // Update execution status to 'running'
      await this.updateExecutionStatus(job.id, 'running', new Date());

      // Get environment details
      const environment = await this.getEnvironment(job.environmentId);

      // Execute tests for each browser
      const results: TestExecutionResult[] = [];

      for (const browserType of job.browsers) {
        logger.info('Executing tests for browser', { executionId: job.id, browser: browserType });

        const browser = await this.playwrightExecutor.launchBrowser(browserType);

        for (const script of job.scripts) {
          // Resolve the script path
          const resolvedPath = this.resolveScriptPath(script.filePath);
          
          const context: TestExecutionContext = {
            executionId: job.id,
            browser: browserType,
            testScript: {
              id: script.id,
              name: script.name,
              filePath: resolvedPath,
            },
            environment: {
              baseUrl: environment.base_url,
              variables: environment.variables,
            },
          };

          try {
            const result = await this.playwrightExecutor.executeTest(context);
            results.push(result);

            // Save test result to database
            await this.saveTestResult(job.id, result);

            // Upload artifacts to MinIO
            await this.uploadArtifacts(job.id, result);

          } catch (error: any) {
            logger.error('Test execution failed', { 
              executionId: job.id, 
              scriptId: script.id, 
              error: error.message 
            });

            // Save failed result
            await this.saveTestResult(job.id, {
              scriptId: script.id,
              browser: browserType,
              status: 'failed',
              duration: 0,
              errorMessage: error.message,
              stackTrace: error.stack,
              screenshots: [],
            });
          }
        }

        await browser.close();
      }

      // Calculate overall status
      const allPassed = results.every(r => r.status === 'passed');
      const someFailed = results.some(r => r.status === 'failed');
      const finalStatus = allPassed ? 'passed' : someFailed ? 'failed' : 'passed';

      // Update execution status
      const completedAt = new Date();
      const duration = completedAt.getTime() - new Date(job.createdAt).getTime();
      await this.updateExecutionStatus(job.id, finalStatus, null, completedAt, duration);

      logger.info('Test execution job completed', {
        executionId: job.id,
        status: finalStatus,
        totalTests: results.length,
        passed: results.filter(r => r.status === 'passed').length,
        failed: results.filter(r => r.status === 'failed').length,
      });

    } catch (error: any) {
      logger.error('Test execution job failed', { executionId: job.id, error: error.message });
      await this.updateExecutionStatus(job.id, 'failed', null, new Date());
      throw error;
    }
  }

  private async getEnvironment(environmentId: string): Promise<any> {
    const result = await pool.query(
      'SELECT base_url, variables FROM test_environments WHERE id = $1',
      [environmentId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Environment not found: ${environmentId}`);
    }

    return result.rows[0];
  }

  private async updateExecutionStatus(
    executionId: string,
    status: string,
    startedAt?: Date | null,
    completedAt?: Date | null,
    duration?: number
  ): Promise<void> {
    const updates: string[] = ['status = $2'];
    const values: any[] = [executionId, status];
    let paramCount = 3;

    if (startedAt !== undefined) {
      updates.push(`started_at = $${paramCount++}`);
      values.push(startedAt);
    }

    if (completedAt !== undefined) {
      updates.push(`completed_at = $${paramCount++}`);
      values.push(completedAt);
    }

    if (duration !== undefined) {
      updates.push(`duration = $${paramCount++}`);
      values.push(duration);
    }

    await pool.query(
      `UPDATE test_executions SET ${updates.join(', ')} WHERE id = $1`,
      values
    );

    logger.info('Execution status updated', { executionId, status });
  }

  private async saveTestResult(executionId: string, result: TestExecutionResult): Promise<void> {
    await pool.query(
      `INSERT INTO test_results (
        execution_id, script_id, browser, status, duration, 
        error_message, stack_trace, retry_attempt
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        executionId,
        result.scriptId,
        result.browser,
        result.status,
        result.duration,
        result.errorMessage || null,
        result.stackTrace || null,
        0, // retry_attempt
      ]
    );

    logger.info('Test result saved', { 
      executionId, 
      scriptId: result.scriptId, 
      status: result.status 
    });
  }

  private async uploadArtifacts(executionId: string, result: TestExecutionResult): Promise<void> {
    // Upload screenshots
    for (const screenshotPath of result.screenshots) {
      if (fs.existsSync(screenshotPath)) {
        const fileName = path.basename(screenshotPath);
        const objectName = `${executionId}/${result.scriptId}/screenshots/${fileName}`;
        
        try {
          const url = await this.minioStorage.uploadFile(
            'test-artifacts',
            objectName,
            screenshotPath
          );

          // Save artifact record to database
          await this.saveArtifactRecord(executionId, result.scriptId, 'screenshot', objectName, screenshotPath);
          
          logger.info('Screenshot uploaded', { executionId, objectName, url });
        } catch (error) {
          logger.error('Failed to upload screenshot', { screenshotPath, error });
        }
      }
    }

    // Upload video
    if (result.videoPath && fs.existsSync(result.videoPath)) {
      const fileName = path.basename(result.videoPath);
      const objectName = `${executionId}/${result.scriptId}/videos/${fileName}`;
      
      try {
        const url = await this.minioStorage.uploadFile(
          'test-artifacts',
          objectName,
          result.videoPath
        );

        // Save artifact record to database
        await this.saveArtifactRecord(executionId, result.scriptId, 'video', objectName, result.videoPath);
        
        logger.info('Video uploaded', { executionId, objectName, url });
      } catch (error) {
        logger.error('Failed to upload video', { videoPath: result.videoPath, error });
      }
    }
  }

  private async saveArtifactRecord(
    executionId: string,
    scriptId: string,
    type: string,
    objectName: string,
    filePath: string
  ): Promise<void> {
    const stats = fs.statSync(filePath);
    const fileName = path.basename(filePath);
    const mimeType = this.getMimeType(fileName);

    // Get result_id for this execution and script
    const resultQuery = await pool.query(
      'SELECT id FROM test_results WHERE execution_id = $1 AND script_id = $2 ORDER BY created_at DESC LIMIT 1',
      [executionId, scriptId]
    );

    if (resultQuery.rows.length === 0) {
      logger.warn('No test result found for artifact', { executionId, scriptId });
      return;
    }

    const resultId = resultQuery.rows[0].id;

    await pool.query(
      `INSERT INTO test_artifacts (
        result_id, execution_id, type, file_path, file_name, 
        size_bytes, mime_type, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        resultId,
        executionId,
        type,
        objectName,
        fileName,
        stats.size,
        mimeType,
        {},
      ]
    );
  }

  private getMimeType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webm': 'video/webm',
      '.mp4': 'video/mp4',
      '.json': 'application/json',
      '.html': 'text/html',
      '.txt': 'text/plain',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
}
