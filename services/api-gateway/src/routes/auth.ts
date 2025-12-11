import { Router, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { pool } from '../database';
import { config } from '../config';
import { asyncHandler, ApiError } from '../middleware/errorHandler';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { createLogger } from '@watt/shared-utils';

const logger = createLogger('auth-routes');
const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  organizationName: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Register new user and organization
router.post('/register', asyncHandler(async (req: AuthRequest, res: Response) => {
  const validation = registerSchema.safeParse(req.body);
  
  if (!validation.success) {
    throw new ApiError(400, 'Validation error', 'VALIDATION_ERROR', validation.error.errors);
  }

  const { email, password, firstName, lastName, organizationName } = validation.data;

  // Check if user already exists
  const existingUser = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [email]
  );

  if (existingUser.rows.length > 0) {
    throw new ApiError(409, 'User already exists', 'USER_EXISTS');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Start transaction
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Create organization
    const orgSlug = organizationName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const orgResult = await client.query(
      'INSERT INTO organizations (name, slug, settings) VALUES ($1, $2, $3) RETURNING id',
      [organizationName, orgSlug, {}]
    );
    const organizationId = orgResult.rows[0].id;

    // Create user
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, organization_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email, first_name, last_name, role, organization_id`,
      [email, passwordHash, firstName || null, lastName || null, 'admin', organizationId, true]
    );

    await client.query('COMMIT');

    const user = userResult.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organization_id,
      } as any,
      config.jwt.secret,
      {
        expiresIn: config.jwt.expiresIn,
      } as any
    ) as string;

    logger.info('User registered successfully', { userId: user.id, email: user.email });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        organizationId: user.organization_id,
      },
      token,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Registration failed', { error });
    throw error;
  } finally {
    client.release();
  }
}));

// Login
router.post('/login', asyncHandler(async (req: AuthRequest, res: Response) => {
  const validation = loginSchema.safeParse(req.body);
  
  if (!validation.success) {
    throw new ApiError(400, 'Validation error', 'VALIDATION_ERROR', validation.error.errors);
  }

  const { email, password } = validation.data;

  // Get user
  const result = await pool.query(
    `SELECT id, email, password_hash, first_name, last_name, role, organization_id, is_active
     FROM users WHERE email = $1`,
    [email]
  );

  if (result.rows.length === 0) {
    throw new ApiError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
  }

  const user = result.rows[0];

  if (!user.is_active) {
    throw new ApiError(403, 'Account is disabled', 'ACCOUNT_DISABLED');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);

  if (!isValidPassword) {
    throw new ApiError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
  }

  // Update last login
  await pool.query(
    'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
    [user.id]
  );

  // Generate JWT token
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organization_id,
    } as any,
    config.jwt.secret,
    {
      expiresIn: config.jwt.expiresIn,
    } as any
  ) as string;

  logger.info('User logged in', { userId: user.id, email: user.email });

  res.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      organizationId: user.organization_id,
    },
    token,
  });
}));

// Get current user
router.get('/me', authenticateToken, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated', 'NOT_AUTHENTICATED');
  }

  const result = await pool.query(
    `SELECT id, email, first_name, last_name, role, organization_id, is_active, created_at, last_login_at
     FROM users WHERE id = $1`,
    [req.user.id]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
  }

  const user = result.rows[0];

  res.json({
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role,
    organizationId: user.organization_id,
    isActive: user.is_active,
    createdAt: user.created_at,
    lastLoginAt: user.last_login_at,
  });
}));

export default router;
