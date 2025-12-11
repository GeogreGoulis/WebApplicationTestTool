/**
 * Migration: Create test suites and environments tables
 */

import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Test suites table
  pgm.createTable('test_suites', {
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
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    description: {
      type: 'text',
    },
    framework: {
      type: 'test_framework',
      notNull: true,
      default: 'playwright',
    },
    created_by: {
      type: 'uuid',
      notNull: true,
      references: 'users',
      onDelete: 'CASCADE',
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

  pgm.createIndex('test_suites', 'organization_id');
  pgm.createIndex('test_suites', 'created_by');

  // Test environments table
  pgm.createTable('test_environments', {
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
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    base_url: {
      type: 'varchar(500)',
      notNull: true,
    },
    variables: {
      type: 'jsonb',
      notNull: true,
      default: '{}',
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

  pgm.createIndex('test_environments', 'organization_id');

  // Test scripts table
  pgm.createTable('test_scripts', {
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
    name: {
      type: 'varchar(255)',
      notNull: true,
    },
    file_path: {
      type: 'varchar(500)',
      notNull: true,
    },
    framework: {
      type: 'test_framework',
      notNull: true,
    },
    timeout: {
      type: 'integer',
      default: 30000,
    },
    retry_count: {
      type: 'integer',
      default: 0,
    },
    tags: {
      type: 'text[]',
      default: '{}',
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

  pgm.createIndex('test_scripts', 'suite_id');
  pgm.createIndex('test_scripts', 'tags', { method: 'gin' });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('test_scripts');
  pgm.dropTable('test_environments');
  pgm.dropTable('test_suites');
}
