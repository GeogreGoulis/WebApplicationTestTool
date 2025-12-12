import * as amqp from 'amqplib';
import { config } from '../config';
import { createLogger } from '@watt/shared-utils';

const logger = createLogger('rabbitmq-consumer');

export class RabbitMQConsumer {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnecting = false;

  async connect(): Promise<void> {
    if (this.isConnecting) {
      logger.info('Connection already in progress');
      return;
    }

    this.isConnecting = true;

    try {
      logger.info('Connecting to RabbitMQ...', { url: config.rabbitmq.url.replace(/:[^:@]+@/, ':****@') });
      
      this.connection = (await amqp.connect(config.rabbitmq.url)) as any;
      this.channel = (await (this.connection as any).createChannel()) as any;

      // Setup queues
      await this.channel!.assertQueue(config.queues.testExecution, { durable: true });
      await this.channel!.assertQueue(config.queues.testResults, { durable: true });

      // Handle connection events
      (this.connection as any).on('error', (err: Error) => {
        logger.error('RabbitMQ connection error', { error: err.message });
        this.reconnect();
      });

      (this.connection as any).on('close', () => {
        logger.warn('RabbitMQ connection closed');
        this.reconnect();
      });

      logger.info('RabbitMQ connected successfully');
    } catch (error) {
      logger.error('Failed to connect to RabbitMQ', { error });
      this.reconnect();
    } finally {
      this.isConnecting = false;
    }
  }

  private reconnect(): void {
    if (this.reconnectTimeout) {
      return;
    }

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, 5000);
  }

  async consumeTestExecutions(handler: (message: any) => Promise<void>): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    await this.channel.prefetch(config.concurrency.maxConcurrentTests);

    await this.channel.consume(config.queues.testExecution, async (msg) => {
      if (!msg) return;

      try {
        const content = JSON.parse(msg.content.toString());
        logger.info('Processing test execution message', { executionId: content.id });

        await handler(content);

        this.channel?.ack(msg);
        logger.info('Test execution message processed successfully', { executionId: content.id });
      } catch (error) {
        logger.error('Error processing test execution message', { error });
        
        // Reject and requeue message
        this.channel?.nack(msg, false, true);
      }
    });

    logger.info('Started consuming test execution queue', { queue: config.queues.testExecution });
  }

  async publishResult(message: any): Promise<boolean> {
    if (!this.channel) {
      logger.error('Cannot publish: channel not initialized');
      return false;
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(message));
      const result = this.channel.sendToQueue(config.queues.testResults, messageBuffer, {
        persistent: true,
        timestamp: Date.now(),
      });

      if (result) {
        logger.info('Result published to queue', { executionId: message.executionId });
      }

      return result;
    } catch (error) {
      logger.error('Failed to publish result', { error });
      return false;
    }
  }

  async close(): Promise<void> {
    try {
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }

      if (this.channel) {
        await this.channel.close();
      }

      if (this.connection) {
        await (this.connection as any).close();
      }

      logger.info('RabbitMQ connection closed');
    } catch (error) {
      logger.error('Error closing RabbitMQ connection', { error });
    }
  }
}

export const rabbitmqConsumer = new RabbitMQConsumer();
