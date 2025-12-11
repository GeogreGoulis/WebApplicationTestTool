import express, { Application } from 'express';
import { config } from './config';
import { testDatabaseConnection } from './database';
import { rabbitmqService } from './services/rabbitmq';
import { createLogger } from '@watt/shared-utils';
import * as executionController from './controllers/execution';

const logger = createLogger('core-app');

class CoreApplication {
  private app: Application;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  }

  private setupRoutes() {
    // Health check
    this.app.get('/health', (_req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'core-app',
        version: '0.1.0',
      });
    });

    // Execution endpoints
    this.app.post('/api/executions', executionController.createExecution);
    this.app.get('/api/executions/:id', executionController.getExecution);
  }

  async start() {
    try {
      // Test database connection
      const dbConnected = await testDatabaseConnection();
      if (!dbConnected) {
        throw new Error('Failed to connect to database');
      }

      // Connect to RabbitMQ
      await rabbitmqService.connect();

      // TODO: Setup queue consumers for processing results

      // Start server
      this.app.listen(config.port, () => {
        logger.info('Core Application started', {
          port: config.port,
          environment: config.nodeEnv,
        });
      });

      // Graceful shutdown
      process.on('SIGTERM', this.shutdown.bind(this));
      process.on('SIGINT', this.shutdown.bind(this));

    } catch (error) {
      logger.error('Failed to start Core Application', { error });
      process.exit(1);
    }
  }

  private async shutdown() {
    logger.info('Shutting down gracefully...');
    
    try {
      await rabbitmqService.close();
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', { error });
      process.exit(1);
    }
  }
}

// Start application
const app = new CoreApplication();
app.start();
