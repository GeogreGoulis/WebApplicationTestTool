/**
 * Migration: Create artifacts and integrations tables
 */

import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Test artifacts table
  pgm.createTable('test_artifacts', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    result_id: {
      type: 'uuid',
      notNull: true,
      references: 'test_results',
      onDelete: 'CASCADE',
    },
    execution_id: {
      type: 'uuid',
      notNull: true,
      references: 'test_executions',
      onDelete: 'CASCADE',
    },
    type: {
      type: 'artifact_type',
      notNull: true,
    },
    file_path: {
      type: 'varchar(500)',
      notNull: true,
    },
    file_name: {
      type: 'varchar(255)',
      notNull: true,
    },
    size_bytes: {
      type: 'bigint',
      notNull: true,
    },
    mime_type: {
      type: 'varchar(100)',
      notNull: true,
    },
    metadata: {
      type: 'jsonb',
      default: '{}',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createIndex('test_artifacts', 'result_id');
  pgm.createIndex('test_artifacts', 'execution_id');
  pgm.createIndex('test_artifacts', 'type');

  // Integrations table
  pgm.createTable('integrations', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    organization_id: {
      type: 'uuid',
      notNull: true,
      references: 'organizations',
      onDelete: 'CASCADE',
    },
    type: {
      type: 'integration_type',
      notNull: true,
    },
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    config: {
      type: 'jsonb',
      notNull: true,
      default: '{}',
    },
    credentials: {
      type: 'text',
    },
    enabled: {
      type: 'boolean',
      notNull: true,
      default: true,
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createIndex('integrations', 'organization_id');
  pgm.createIndex('integrations', 'type');

  // Test logs table
  pgm.createTable('test_logs', {
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
    result_id: {
      type: 'uuid',
      references: 'test_results',
      onDelete: 'CASCADE',
    },
    level: {
      type: 'log_level',
      notNull: true,
    },
    message: {
      type: 'text',
      notNull: true,
    },
    metadata: {
      type: 'jsonb',
      default: '{}',
    },
    timestamp: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  pgm.createIndex('test_logs', 'execution_id');
  pgm.createIndex('test_logs', 'timestamp');
  pgm.createIndex('test_logs', 'level');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('test_logs');
  pgm.dropTable('integrations');
  pgm.dropTable('test_artifacts');
}
