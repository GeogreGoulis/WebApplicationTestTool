import { Router, Response } from 'express';
import { z } from 'zod';
import { pool } from '../database';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { createLogger } from '@watt/shared-utils';

const logger = createLogger('environments-routes');
const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Validation schemas
const createEnvironmentSchema = z.object({
  name: z.string().min(1).max(255),
  baseUrl: z.string().url().max(500),
  variables: z.record(z.string()).optional(),
});

const updateEnvironmentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  baseUrl: z.string().url().max(500).optional(),
  variables: z.record(z.string()).optional(),
});

// Get all environments for organization
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated', 'NOT_AUTHENTICATED');
  }

  const result = await pool.query(
    `SELECT id, organization_id, name, base_url, variables, created_at, updated_at
     FROM test_environments
     WHERE organization_id = $1
     ORDER BY name ASC`,
    [req.user.organizationId]
  );

  res.json({
    environments: result.rows.map((row: any) => ({
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      baseUrl: row.base_url,
      variables: row.variables,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })),
  });
}));

// Get single environment
router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated', 'NOT_AUTHENTICATED');
  }

  const result = await pool.query(
    `SELECT id, organization_id, name, base_url, variables, created_at, updated_at
     FROM test_environments
     WHERE id = $1 AND organization_id = $2`,
    [req.params.id, req.user.organizationId]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, 'Environment not found', 'NOT_FOUND');
  }

  const env = result.rows[0];

  res.json({
    id: env.id,
    organizationId: env.organization_id,
    name: env.name,
    baseUrl: env.base_url,
    variables: env.variables,
    createdAt: env.created_at,
    updatedAt: env.updated_at,
  });
}));

// Create environment
router.post('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated', 'NOT_AUTHENTICATED');
  }

  const validation = createEnvironmentSchema.safeParse(req.body);
  
  if (!validation.success) {
    throw new ApiError(400, 'Validation error', 'VALIDATION_ERROR', validation.error.errors);
  }

  const { name, baseUrl, variables } = validation.data;

  const result = await pool.query(
    `INSERT INTO test_environments (organization_id, name, base_url, variables)
     VALUES ($1, $2, $3, $4)
     RETURNING id, organization_id, name, base_url, variables, created_at, updated_at`,
    [req.user.organizationId, name, baseUrl, variables || {}]
  );

  const env = result.rows[0];

  logger.info('Environment created', { 
    envId: env.id, 
    name,
    userId: req.user.id 
  });

  res.status(201).json({
    id: env.id,
    organizationId: env.organization_id,
    name: env.name,
    baseUrl: env.base_url,
    variables: env.variables,
    createdAt: env.created_at,
    updatedAt: env.updated_at,
  });
}));

// Update environment
router.put('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated', 'NOT_AUTHENTICATED');
  }

  const validation = updateEnvironmentSchema.safeParse(req.body);
  
  if (!validation.success) {
    throw new ApiError(400, 'Validation error', 'VALIDATION_ERROR', validation.error.errors);
  }

  // Verify environment belongs to user's organization
  const envCheck = await pool.query(
    'SELECT id FROM test_environments WHERE id = $1 AND organization_id = $2',
    [req.params.id, req.user.organizationId]
  );

  if (envCheck.rows.length === 0) {
    throw new ApiError(404, 'Environment not found', 'NOT_FOUND');
  }

  const updates: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  const { name, baseUrl, variables } = validation.data;

  if (name !== undefined) {
    updates.push(`name = $${paramCount}`);
    values.push(name);
    paramCount++;
  }

  if (baseUrl !== undefined) {
    updates.push(`base_url = $${paramCount}`);
    values.push(baseUrl);
    paramCount++;
  }

  if (variables !== undefined) {
    updates.push(`variables = $${paramCount}`);
    values.push(variables);
    paramCount++;
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(req.params.id);

  const result = await pool.query(
    `UPDATE test_environments SET ${updates.join(', ')}
     WHERE id = $${paramCount}
     RETURNING id, organization_id, name, base_url, variables, created_at, updated_at`,
    values
  );

  const env = result.rows[0];

  logger.info('Environment updated', { envId: env.id, userId: req.user.id });

  res.json({
    id: env.id,
    organizationId: env.organization_id,
    name: env.name,
    baseUrl: env.base_url,
    variables: env.variables,
    createdAt: env.created_at,
    updatedAt: env.updated_at,
  });
}));

// Delete environment
router.delete('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated', 'NOT_AUTHENTICATED');
  }

  // Verify environment belongs to user's organization
  const envCheck = await pool.query(
    'SELECT id FROM test_environments WHERE id = $1 AND organization_id = $2',
    [req.params.id, req.user.organizationId]
  );

  if (envCheck.rows.length === 0) {
    throw new ApiError(404, 'Environment not found', 'NOT_FOUND');
  }

  // Check if environment is used in any executions
  const usageCheck = await pool.query(
    'SELECT COUNT(*) as count FROM test_executions WHERE environment_id = $1',
    [req.params.id]
  );

  if (parseInt(usageCheck.rows[0].count) > 0) {
    throw new ApiError(400, 'Environment is in use and cannot be deleted', 'IN_USE');
  }

  await pool.query('DELETE FROM test_environments WHERE id = $1', [req.params.id]);

  logger.info('Environment deleted', { envId: req.params.id, userId: req.user.id });

  res.status(204).send();
}));

export default router;
