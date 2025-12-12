import { Router, Request, Response } from 'express';
import { createLogger } from '@watt/shared-utils';
import { EventEmitter } from 'events';

const logger = createLogger('sse-routes');
const router = Router();

// Event emitter for execution updates
export const executionEvents = new EventEmitter();

// SSE endpoint for real-time execution updates
router.get('/executions/:id/stream', async (req: Request, res: Response) => {
  const executionId = req.params.id;

  logger.info('Client connected to execution stream', { executionId });

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', executionId })}\n\n`);

  // Handler for execution updates
  const updateHandler = (data: any) => {
    if (data.executionId === executionId) {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }
  };

  // Register listener
  executionEvents.on('execution:update', updateHandler);

  // Cleanup on client disconnect
  req.on('close', () => {
    logger.info('Client disconnected from execution stream', { executionId });
    executionEvents.off('execution:update', updateHandler);
    res.end();
  });
});

// Broadcast execution update (called internally by execution service)
export function broadcastExecutionUpdate(executionId: string, update: any) {
  executionEvents.emit('execution:update', {
    executionId,
    ...update,
    timestamp: new Date().toISOString(),
  });
}

export default router;
