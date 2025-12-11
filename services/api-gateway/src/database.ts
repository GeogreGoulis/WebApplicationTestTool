import { Pool } from 'pg';
import { createClient } from 'redis';
import { config } from './config';
import { createLogger } from '@watt/shared-utils';

const logger = createLogger('database');

// PostgreSQL Connection Pool
export const pool = new Pool({
  connectionString: config.database.url,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err: Error) => {
  logger.error('Unexpected database error', { error: err.message });
});

pool.on('connect', () => {
  logger.info('Database connection established');
});

// Redis Client
export const redisClient = createClient({
  url: config.redis.url,
});

redisClient.on('error', (err) => {
  logger.error('Redis connection error', { error: err.message });
});

redisClient.on('connect', () => {
  logger.info('Redis connection established');
});

// Connect to Redis
export async function connectRedis() {
  try {
    await redisClient.connect();
    logger.info('Redis connected successfully');
  } catch (error) {
    logger.error('Failed to connect to Redis', { error });
    throw error;
  }
}

// Test database connection
export async function testDatabaseConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    logger.info('Database connection test successful', { timestamp: result.rows[0].now });
    return true;
  } catch (error) {
    logger.error('Database connection test failed', { error });
    return false;
  }
}

// Graceful shutdown
export async function closeConnections() {
  try {
    await pool.end();
    await redisClient.quit();
    logger.info('All database connections closed');
  } catch (error) {
    logger.error('Error closing database connections', { error });
  }
}
