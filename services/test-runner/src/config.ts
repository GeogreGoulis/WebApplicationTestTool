import { config as dotenvConfig } from 'dotenv';
import path from 'path';

dotenvConfig({ path: path.join(__dirname, '../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3200', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://watt:watt_dev_password@localhost:5432/watt',
  },
  
  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://watt:watt_dev_password@localhost:5672',
  },
  
  queues: {
    testExecution: process.env.QUEUE_TEST_EXECUTION || 'test-execution-queue',
    testResults: process.env.QUEUE_TEST_RESULTS || 'test-results-queue',
  },
  
  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    accessKey: process.env.MINIO_ACCESS_KEY || 'watt',
    secretKey: process.env.MINIO_SECRET_KEY || 'watt_dev_password',
    useSSL: process.env.MINIO_USE_SSL === 'true',
    buckets: {
      artifacts: process.env.MINIO_BUCKET_ARTIFACTS || 'test-artifacts',
      scripts: process.env.MINIO_BUCKET_SCRIPTS || 'test-scripts',
      reports: process.env.MINIO_BUCKET_REPORTS || 'reports',
    },
  },
  
  playwright: {
    headless: process.env.PLAYWRIGHT_HEADLESS !== 'false',
    slowMo: parseInt(process.env.PLAYWRIGHT_SLOW_MO || '0', 10),
    timeout: parseInt(process.env.PLAYWRIGHT_TIMEOUT || '30000', 10),
    videoRecording: process.env.VIDEO_RECORDING !== 'false',
    screenshotOnFailure: process.env.SCREENSHOT_ON_FAILURE !== 'false',
  },
  
  concurrency: {
    maxConcurrentTests: parseInt(process.env.MAX_CONCURRENT_TESTS || '3', 10),
  },
};
