import { Request, Response } from 'express';
import { z } from 'zod';
import { executionService } from '../services/execution';
import { createLogger } from '@watt/shared-utils';

const logger = createLogger('execution-controller');

const createExecutionSchema = z.object({
  suiteId: z.string().uuid(),
  environmentId: z.string().uuid(),
  triggeredBy: z.string().uuid(),
  triggerSource: z.enum(['manual', 'schedule', 'webhook', 'ci_cd']).default('manual'),
  browsers: z.array(z.enum(['chromium', 'firefox', 'webkit'])).min(1),
  parallelCount: z.number().int().min(1).max(10).optional(),
  metadata: z.record(z.any()).optional(),
});

export async function createExecution(req: Request, res: Response) {
  try {
    const validation = createExecutionSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: validation.error.errors,
      });
    }

    const execution = await executionService.createExecution(validation.data);

    res.status(201).json(execution);
  } catch (error: any) {
    logger.error('Failed to create execution', { error });
    res.status(500).json({
      error: 'Failed to create execution',
      message: error.message,
    });
  }
}

export async function getExecution(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const execution = await executionService.getExecutionById(id);

    if (!execution) {
      return res.status(404).json({ error: 'Execution not found' });
    }

    res.json(execution);
  } catch (error: any) {
    logger.error('Failed to get execution', { error });
    res.status(500).json({
      error: 'Failed to get execution',
      message: error.message,
    });
  }
}
