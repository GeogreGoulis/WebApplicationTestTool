import { pool } from '../database';
import { rabbitmqService } from './rabbitmq';
import { config } from '../config';
import { createLogger } from '@watt/shared-utils';
import { TestExecution, ExecutionStatus } from '@watt/shared-types';

const logger = createLogger('execution-service');

export interface CreateExecutionRequest {
  suiteId: string;
  environmentId: string;
  triggeredBy: string;
  triggerSource: 'manual' | 'schedule' | 'webhook' | 'ci_cd';
  browsers: ('chromium' | 'firefox' | 'webkit')[];
  parallelCount?: number;
  metadata?: Record<string, any>;
}

export class ExecutionService {
  async createExecution(request: CreateExecutionRequest): Promise<TestExecution> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Verify suite exists
      const suiteCheck = await client.query(
        'SELECT id FROM test_suites WHERE id = $1',
        [request.suiteId]
      );

      if (suiteCheck.rows.length === 0) {
        throw new Error('Test suite not found');
      }

      // Verify environment exists
      const envCheck = await client.query(
        'SELECT id FROM test_environments WHERE id = $1',
        [request.environmentId]
      );

      if (envCheck.rows.length === 0) {
        throw new Error('Test environment not found');
      }

      // Create execution record
      const result = await client.query(
        `INSERT INTO test_executions (
          suite_id, environment_id, status, triggered_by, trigger_source,
          browsers, parallel_count, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          request.suiteId,
          request.environmentId,
          'pending' as ExecutionStatus,
          request.triggeredBy,
          request.triggerSource,
          request.browsers,
          request.parallelCount || 1,
          request.metadata || {},
        ]
      );

      const execution = result.rows[0];

      // Get test scripts for this suite
      const scriptsResult = await client.query(
        'SELECT * FROM test_scripts WHERE suite_id = $1',
        [request.suiteId]
      );

      await client.query('COMMIT');

      // Publish execution job to queue
      const jobMessage = {
        id: execution.id,
        type: 'test-execution',
        suiteId: request.suiteId,
        environmentId: request.environmentId,
        browsers: request.browsers,
        parallelCount: request.parallelCount || 1,
        scripts: scriptsResult.rows.map((s) => ({
          id: s.id,
          name: s.name,
          filePath: s.file_path,
          framework: s.framework,
          timeout: s.timeout,
          retryCount: s.retry_count,
          tags: s.tags,
        })),
        metadata: request.metadata,
        createdAt: new Date().toISOString(),
      };

      await rabbitmqService.publishToQueue(config.queues.testExecution, jobMessage);

      logger.info('Test execution created and queued', {
        executionId: execution.id,
        suiteId: request.suiteId,
        browsers: request.browsers,
      });

      return {
        id: execution.id,
        suiteId: execution.suite_id,
        environmentId: execution.environment_id,
        status: execution.status,
        triggeredBy: execution.triggered_by,
        triggerSource: execution.trigger_source,
        browsers: execution.browsers,
        parallelCount: execution.parallel_count,
        startedAt: execution.started_at,
        completedAt: execution.completed_at,
        duration: execution.duration,
        metadata: execution.metadata,
        createdAt: execution.created_at,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Failed to create execution', { error });
      throw error;
    } finally {
      client.release();
    }
  }

  async updateExecutionStatus(
    executionId: string,
    status: ExecutionStatus,
    additionalData?: { startedAt?: Date; completedAt?: Date; duration?: number }
  ): Promise<void> {
    try {
      const updates: string[] = ['status = $2'];
      const values: any[] = [executionId, status];
      let paramCount = 3;

      if (additionalData?.startedAt) {
        updates.push(`started_at = $${paramCount++}`);
        values.push(additionalData.startedAt);
      }

      if (additionalData?.completedAt) {
        updates.push(`completed_at = $${paramCount++}`);
        values.push(additionalData.completedAt);
      }

      if (additionalData?.duration) {
        updates.push(`duration = $${paramCount++}`);
        values.push(additionalData.duration);
      }

      await pool.query(
        `UPDATE test_executions SET ${updates.join(', ')} WHERE id = $1`,
        values
      );

      logger.info('Execution status updated', { executionId, status });
    } catch (error) {
      logger.error('Failed to update execution status', { executionId, error });
      throw error;
    }
  }

  async getExecutionById(executionId: string): Promise<TestExecution | null> {
    try {
      const result = await pool.query(
        'SELECT * FROM test_executions WHERE id = $1',
        [executionId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        suiteId: row.suite_id,
        environmentId: row.environment_id,
        status: row.status,
        triggeredBy: row.triggered_by,
        triggerSource: row.trigger_source,
        browsers: row.browsers,
        parallelCount: row.parallel_count,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        duration: row.duration,
        metadata: row.metadata,
        createdAt: row.created_at,
      };
    } catch (error) {
      logger.error('Failed to get execution', { executionId, error });
      throw error;
    }
  }
}

export const executionService = new ExecutionService();
