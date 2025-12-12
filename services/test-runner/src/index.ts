import express from 'express';
import { config } from './config';
import { testDatabaseConnection } from './database';
import { rabbitmqConsumer } from './storage/rabbitmq';
import { minioStorage } from './storage/minio';
import { TestExecutionService } from './services/testExecution';
import { createLogger } from '@watt/shared-utils';

const logger = createLogger('test-runner-main');

const app = express();

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'test-runner',
    timestamp: new Date().toISOString(),
  });
});

// Readiness check endpoint
app.get('/ready', async (_req, res) => {
  try {
    const dbConnected = await testDatabaseConnection();
    
    res.json({
      status: 'ready',
      database: dbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: 'Service not ready',
      timestamp: new Date().toISOString(),
    });
  }
});

async function startServer() {
  try {
    logger.info('Starting Test Runner service...');

    // Test database connection
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }

    // Connect to RabbitMQ
    await rabbitmqConsumer.connect();

    // Ensure MinIO buckets exist
    await minioStorage.ensureBuckets();

    // Create test execution service
    const testExecutionService = new TestExecutionService();

    // Start consuming test execution queue
    await rabbitmqConsumer.consumeTestExecutions(async (job) => {
      try {
        await testExecutionService.executeJob(job);
      } catch (error: any) {
        logger.error('Error executing test job', { 
          executionId: job.id, 
          error: error.message 
        });
      }
    });

    // Start Express server
    app.listen(config.port, () => {
      logger.info(`Test Runner service listening on port ${config.port}`);
      logger.info('Service ready to process test execution jobs');
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      await rabbitmqConsumer.close();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully...');
      await rabbitmqConsumer.close();
      process.exit(0);
    });

  } catch (error: any) {
    logger.error('Failed to start Test Runner service', { error: error.message });
    process.exit(1);
  }
}

startServer();
