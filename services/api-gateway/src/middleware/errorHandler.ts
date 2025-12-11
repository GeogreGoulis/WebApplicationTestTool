import { Request, Response, NextFunction } from 'express';
import { createLogger } from '@watt/shared-utils';

const logger = createLogger('error-handler');

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export class ApiError extends Error implements AppError {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error('Request error', {
    method: req.method,
    url: req.url,
    statusCode,
    error: message,
    code: err.code,
    details: err.details,
    stack: err.stack,
  });

  res.status(statusCode).json({
    error: message,
    code: err.code,
    details: process.env.NODE_ENV === 'development' ? err.details : undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: 'Route not found',
    path: req.url,
  });
}

export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
