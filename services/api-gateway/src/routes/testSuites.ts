import { Router, Response } from 'express';
import { z } from 'zod';
import { pool } from '../database';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { createLogger } from '@watt/shared-utils';

const logger = createLogger('test-suites-routes');
const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Validation schemas
const createTestSuiteSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  framework: z.enum(['playwright', 'cypress', 'selenium']).default('playwright'),
});

const updateTestSuiteSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
});

// Get all test suites for organization
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated', 'NOT_AUTHENTICATED');
  }

  const result = await pool.query(
    `SELECT ts.id, ts.name, ts.description, ts.framework, ts.created_at, ts.updated_at,
            u.email as created_by_email, u.first_name, u.last_name
     FROM test_suites ts
     JOIN users u ON ts.created_by = u.id
     WHERE ts.organization_id = $1
     ORDER BY ts.created_at DESC`,
    [req.user.organizationId]
  );

  res.json({
    testSuites: result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      framework: row.framework,
      createdBy: {
        email: row.created_by_email,
        firstName: row.first_name,
        lastName: row.last_name,
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  });
}));

// Get single test suite
router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated', 'NOT_AUTHENTICATED');
  }

  const result = await pool.query(
    `SELECT ts.id, ts.name, ts.description, ts.framework, ts.created_at, ts.updated_at,
            u.email as created_by_email, u.first_name, u.last_name,
            COUNT(DISTINCT tsc.id) as script_count,
            COUNT(DISTINCT te.id) as execution_count
     FROM test_suites ts
     JOIN users u ON ts.created_by = u.id
     LEFT JOIN test_scripts tsc ON tsc.suite_id = ts.id
     LEFT JOIN test_executions te ON te.suite_id = ts.id
     WHERE ts.id = $1 AND ts.organization_id = $2
     GROUP BY ts.id, u.email, u.first_name, u.last_name`,
    [req.params.id, req.user.organizationId]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, 'Test suite not found', 'NOT_FOUND');
  }

  const suite = result.rows[0];

  res.json({
    id: suite.id,
    name: suite.name,
    description: suite.description,
    framework: suite.framework,
    createdBy: {
      email: suite.created_by_email,
      firstName: suite.first_name,
      lastName: suite.last_name,
    },
    stats: {
      scriptCount: parseInt(suite.script_count),
      executionCount: parseInt(suite.execution_count),
    },
    createdAt: suite.created_at,
    updatedAt: suite.updated_at,
  });
}));

// Create test suite
router.post('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated', 'NOT_AUTHENTICATED');
  }

  const validation = createTestSuiteSchema.safeParse(req.body);
  
  if (!validation.success) {
    throw new ApiError(400, 'Validation error', 'VALIDATION_ERROR', validation.error.errors);
  }

  const { name, description, framework } = validation.data;

  const result = await pool.query(
    `INSERT INTO test_suites (organization_id, name, description, framework, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, description, framework, created_at, updated_at`,
    [req.user.organizationId, name, description || null, framework, req.user.id]
  );

  const suite = result.rows[0];

  logger.info('Test suite created', { 
    suiteId: suite.id, 
    name: suite.name, 
    userId: req.user.id 
  });

  res.status(201).json({
    id: suite.id,
    name: suite.name,
    description: suite.description,
    framework: suite.framework,
    createdAt: suite.created_at,
    updatedAt: suite.updated_at,
  });
}));

// Update test suite
router.put('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated', 'NOT_AUTHENTICATED');
  }

  const validation = updateTestSuiteSchema.safeParse(req.body);
  
  if (!validation.success) {
    throw new ApiError(400, 'Validation error', 'VALIDATION_ERROR', validation.error.errors);
  }

  const { name, description } = validation.data;

  // Check if suite exists and belongs to organization
  const existing = await pool.query(
    'SELECT id FROM test_suites WHERE id = $1 AND organization_id = $2',
    [req.params.id, req.user.organizationId]
  );

  if (existing.rows.length === 0) {
    throw new ApiError(404, 'Test suite not found', 'NOT_FOUND');
  }

  // Build dynamic update query
  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  if (name !== undefined) {
    updates.push(`name = $${paramCount++}`);
    values.push(name);
  }
  if (description !== undefined) {
    updates.push(`description = $${paramCount++}`);
    values.push(description);
  }
  updates.push(`updated_at = CURRENT_TIMESTAMP`);

  values.push(req.params.id);

  const result = await pool.query(
    `UPDATE test_suites SET ${updates.join(', ')}
     WHERE id = $${paramCount}
     RETURNING id, name, description, framework, created_at, updated_at`,
    values
  );

  const suite = result.rows[0];

  logger.info('Test suite updated', { suiteId: suite.id, userId: req.user.id });

  res.json({
    id: suite.id,
    name: suite.name,
    description: suite.description,
    framework: suite.framework,
    createdAt: suite.created_at,
    updatedAt: suite.updated_at,
  });
}));

// Delete test suite
router.delete('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated', 'NOT_AUTHENTICATED');
  }

  const result = await pool.query(
    'DELETE FROM test_suites WHERE id = $1 AND organization_id = $2 RETURNING id',
    [req.params.id, req.user.organizationId]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, 'Test suite not found', 'NOT_FOUND');
  }

  logger.info('Test suite deleted', { suiteId: req.params.id, userId: req.user.id });

  res.status(204).send();
}));

export default router;
