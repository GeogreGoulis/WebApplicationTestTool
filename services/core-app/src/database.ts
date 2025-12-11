import { Pool } from 'pg';
import { config } from './config';
import { createLogger } from '@watt/shared-utils';

const logger = createLogger('core-app-database');

export const pool = new Pool({
  connectionString: config.database.url,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  logger.error('Unexpected database error', { error: err.message });
});

pool.on('connect', () => {
  logger.info('Database connection established');
});

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
