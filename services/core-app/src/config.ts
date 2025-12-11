import { config as dotenvConfig } from 'dotenv';
import path from 'path';

dotenvConfig({ path: path.join(__dirname, '../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3100', 10),
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
    artifactProcessing: process.env.QUEUE_ARTIFACT_PROCESSING || 'artifact-processing-queue',
  },
};
