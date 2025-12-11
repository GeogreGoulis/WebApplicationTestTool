/**
 * Migration: Create test executions and results tables
 */

import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Test executions table
  pgm.createTable('test_executions', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    suite_id: {
      type: 'uuid',
      notNull: true,
      references: 'test_suites',
      onDelete: 'CASCADE',
    },
    environment_id: {
      type: 'uuid',
      notNull: true,
      references: 'test_environments',
      onDelete: 'RESTRICT',
    },
    status: {
      type: 'execution_status',
      notNull: true,
      default: 'pending',
    },
    triggered_by: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
    },
    trigger_source: {
      type: 'trigger_source',
      notNull: true,
      default: 'manual',
    },
    browsers: {
      type: 'browser_type[]',
      notNull: true,
    },
    parallel_count: {
      type: 'integer',
      notNull: true,
      default: 1,
    },
    started_at: {
      type: 'timestamp',
    },
    completed_at: {
      type: 'timestamp',
    },
    duration: {
      type: 'integer',
    },
    metadata: {
      type: 'jsonb',
      notNull: true,
      default: '{}',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createIndex('test_executions', 'suite_id');
  pgm.createIndex('test_executions', 'status');
  pgm.createIndex('test_executions', 'created_at');

  // Test results table
  pgm.createTable('test_results', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    execution_id: {
      type: 'uuid',
      notNull: true,
      references: 'test_executions',
      onDelete: 'CASCADE',
    },
    script_id: {
      type: 'uuid',
      notNull: true,
      references: 'test_scripts',
      onDelete: 'CASCADE',
    },
    browser: {
      type: 'browser_type',
      notNull: true,
    },
    status: {
      type: 'execution_status',
      notNull: true,
    },
    duration: {
      type: 'integer',
      notNull: true,
    },
    error_message: {
      type: 'text',
    },
    stack_trace: {
      type: 'text',
    },
    retry_attempt: {
      type: 'integer',
      notNull: true,
      default: 0,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createIndex('test_results', 'execution_id');
  pgm.createIndex('test_results', 'status');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('test_results');
  pgm.dropTable('test_executions');
}
