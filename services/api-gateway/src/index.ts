import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { connectRedis, testDatabaseConnection, closeConnections } from './database';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { createLogger } from '@watt/shared-utils';

// Routes
import authRoutes from './routes/auth';
import testSuitesRoutes from './routes/testSuites';

const logger = createLogger('api-gateway');

class Server {
  private app: Application;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware() {
    // Security
    this.app.use(helmet());
    this.app.use(cors({
      origin: config.cors.origin,
      credentials: true,
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.maxRequests,
      message: 'Too many requests from this IP, please try again later.',
    });
    this.app.use('/api/', limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use(requestLogger);
  }

  private setupRoutes() {
    // Health check
    this.app.get('/health', (_req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'api-gateway',
        version: '0.1.0',
      });
    });

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/test-suites', testSuitesRoutes);

    // 404 handler
    this.app.use(notFoundHandler);
  }

  private setupErrorHandling() {
    this.app.use(errorHandler);
  }

  async start() {
    try {
      // Test database connection
      const dbConnected = await testDatabaseConnection();
      if (!dbConnected) {
        throw new Error('Failed to connect to database');
      }

      // Connect to Redis
      await connectRedis();

      // Start server
      this.app.listen(config.port, () => {
        logger.info(`API Gateway started`, {
          port: config.port,
          environment: config.nodeEnv,
          cors: config.cors.origin,
        });
      });

      // Graceful shutdown
      process.on('SIGTERM', this.shutdown.bind(this));
      process.on('SIGINT', this.shutdown.bind(this));

    } catch (error) {
      logger.error('Failed to start server', { error });
      process.exit(1);
    }
  }

  private async shutdown() {
    logger.info('Shutting down gracefully...');
    
    try {
      await closeConnections();
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', { error });
      process.exit(1);
    }
  }
}

// Start server
const server = new Server();
server.start();
