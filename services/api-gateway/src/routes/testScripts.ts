import { Router, Response } from 'express';
import { z } from 'zod';
import { pool } from '../database';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { createLogger } from '@watt/shared-utils';

const logger = createLogger('test-scripts-routes');
const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Validation schemas
const createTestScriptSchema = z.object({
  suiteId: z.string().uuid(),
  name: z.string().min(1).max(255),
  filePath: z.string().min(1).max(500),
  framework: z.enum(['playwright', 'cypress', 'selenium']).default('playwright'),
  timeout: z.number().int().positive().optional(),
  retryCount: z.number().int().min(0).optional(),
  tags: z.array(z.string()).optional(),
});

const updateTestScriptSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  filePath: z.string().min(1).max(500).optional(),
  timeout: z.number().int().positive().optional(),
  retryCount: z.number().int().min(0).optional(),
  tags: z.array(z.string()).optional(),
});

// Get all scripts for a test suite
router.get('/suite/:suiteId', asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated', 'NOT_AUTHENTICATED');
  }

  // Verify suite belongs to user's organization
  const suiteCheck = await pool.query(
    'SELECT id FROM test_suites WHERE id = $1 AND organization_id = $2',
    [req.params.suiteId, req.user.organizationId]
  );

  if (suiteCheck.rows.length === 0) {
    throw new ApiError(404, 'Test suite not found', 'NOT_FOUND');
  }

  const result = await pool.query(
    `SELECT id, suite_id, name, file_path, framework, timeout, retry_count, tags, created_at, updated_at
     FROM test_scripts
     WHERE suite_id = $1
     ORDER BY name ASC`,
    [req.params.suiteId]
  );

  res.json({
    scripts: result.rows.map((row: any) => ({
      id: row.id,
      suiteId: row.suite_id,
      name: row.name,
      filePath: row.file_path,
      framework: row.framework,
      timeout: row.timeout,
      retryCount: row.retry_count,
      tags: row.tags,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  });
}));

// Get single script
router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated', 'NOT_AUTHENTICATED');
  }

  const result = await pool.query(
    `SELECT ts.id, ts.suite_id, ts.name, ts.file_path, ts.framework, ts.timeout, ts.retry_count, ts.tags, 
            ts.created_at, ts.updated_at, suite.organization_id
     FROM test_scripts ts
     JOIN test_suites suite ON ts.suite_id = suite.id
     WHERE ts.id = $1`,
    [req.params.id]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, 'Test script not found', 'NOT_FOUND');
  }

  const script = result.rows[0];

  // Verify belongs to user's organization
  if (script.organization_id !== req.user.organizationId) {
    throw new ApiError(403, 'Access denied', 'FORBIDDEN');
  }

  res.json({
    id: script.id,
    suiteId: script.suite_id,
    name: script.name,
    filePath: script.file_path,
    framework: script.framework,
    timeout: script.timeout,
    retryCount: script.retry_count,
    tags: script.tags,
    createdAt: script.created_at,
    updatedAt: script.updated_at,
  });
}));

// Create test script
router.post('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated', 'NOT_AUTHENTICATED');
  }

  const validation = createTestScriptSchema.safeParse(req.body);
  
  if (!validation.success) {
    throw new ApiError(400, 'Validation error', 'VALIDATION_ERROR', validation.error.errors);
  }

  const { suiteId, name, filePath, framework, timeout, retryCount, tags } = validation.data;

  // Verify suite belongs to user's organization
  const suiteCheck = await pool.query(
    'SELECT id FROM test_suites WHERE id = $1 AND organization_id = $2',
    [suiteId, req.user.organizationId]
  );

  if (suiteCheck.rows.length === 0) {
    throw new ApiError(404, 'Test suite not found', 'NOT_FOUND');
  }

  const result = await pool.query(
    `INSERT INTO test_scripts (suite_id, name, file_path, framework, timeout, retry_count, tags)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, suite_id, name, file_path, framework, timeout, retry_count, tags, created_at, updated_at`,
    [suiteId, name, filePath, framework, timeout || 30000, retryCount || 0, tags || []]
  );

  const script = result.rows[0];

  logger.info('Test script created', { 
    scriptId: script.id, 
    suiteId,
    name,
    userId: req.user.id 
  });

  res.status(201).json({
    id: script.id,
    suiteId: script.suite_id,
    name: script.name,
    filePath: script.file_path,
    framework: script.framework,
    timeout: script.timeout,
    retryCount: script.retry_count,
    tags: script.tags,
    createdAt: script.created_at,
    updatedAt: script.updated_at,
  });
}));

// Update test script
router.put('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated', 'NOT_AUTHENTICATED');
  }

  const validation = updateTestScriptSchema.safeParse(req.body);
  
  if (!validation.success) {
    throw new ApiError(400, 'Validation error', 'VALIDATION_ERROR', validation.error.errors);
  }

  // Verify script belongs to user's organization
  const scriptCheck = await pool.query(
    `SELECT ts.id FROM test_scripts ts
     JOIN test_suites suite ON ts.suite_id = suite.id
     WHERE ts.id = $1 AND suite.organization_id = $2`,
    [req.params.id, req.user.organizationId]
  );

  if (scriptCheck.rows.length === 0) {
    throw new ApiError(404, 'Test script not found', 'NOT_FOUND');
  }

  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  const { name, filePath, timeout, retryCount, tags } = validation.data;

  if (name !== undefined) {
    updates.push(`name = $${paramCount}`);
    values.push(name);
    paramCount++;
  }

  if (filePath !== undefined) {
    updates.push(`file_path = $${paramCount}`);
    values.push(filePath);
    paramCount++;
  }

  if (timeout !== undefined) {
    updates.push(`timeout = $${paramCount}`);
    values.push(timeout);
    paramCount++;
  }

  if (retryCount !== undefined) {
    updates.push(`retry_count = $${paramCount}`);
    values.push(retryCount);
    paramCount++;
  }

  if (tags !== undefined) {
    updates.push(`tags = $${paramCount}`);
    values.push(tags);
    paramCount++;
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(req.params.id);

  const result = await pool.query(
    `UPDATE test_scripts SET ${updates.join(', ')}
     WHERE id = $${paramCount}
     RETURNING id, suite_id, name, file_path, framework, timeout, retry_count, tags, created_at, updated_at`,
    values
  );

  const script = result.rows[0];

  logger.info('Test script updated', { scriptId: script.id, userId: req.user.id });

  res.json({
    id: script.id,
    suiteId: script.suite_id,
    name: script.name,
    filePath: script.file_path,
    framework: script.framework,
    timeout: script.timeout,
    retryCount: script.retry_count,
    tags: script.tags,
    createdAt: script.created_at,
    updatedAt: script.updated_at,
  });
}));

// Delete test script
router.delete('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated', 'NOT_AUTHENTICATED');
  }

  // Verify script belongs to user's organization
  const scriptCheck = await pool.query(
    `SELECT ts.id FROM test_scripts ts
     JOIN test_suites suite ON ts.suite_id = suite.id
     WHERE ts.id = $1 AND suite.organization_id = $2`,
    [req.params.id, req.user.organizationId]
  );

  if (scriptCheck.rows.length === 0) {
    throw new ApiError(404, 'Test script not found', 'NOT_FOUND');
  }

  await pool.query('DELETE FROM test_scripts WHERE id = $1', [req.params.id]);

  logger.info('Test script deleted', { scriptId: req.params.id, userId: req.user.id });

  res.status(204).send();
}));

export default router;
