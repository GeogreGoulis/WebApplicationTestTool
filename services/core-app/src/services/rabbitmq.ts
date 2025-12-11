import * as amqp from 'amqplib';
import { config } from '../config';
import { createLogger } from '@watt/shared-utils';

const logger = createLogger('rabbitmq');

export class RabbitMQService {
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
      await this.setupQueues();

      // Handle connection events
      this.connection!.on('error', (err: Error) => {
        logger.error('RabbitMQ connection error', { error: err.message });
        this.reconnect();
      });

      this.connection!.on('close', () => {
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

  private async setupQueues(): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    // Declare queues
    await this.channel.assertQueue(config.queues.testExecution, { durable: true });
    await this.channel.assertQueue(config.queues.testResults, { durable: true });
    await this.channel.assertQueue(config.queues.artifactProcessing, { durable: true });

    logger.info('Queues initialized', {
      queues: [
        config.queues.testExecution,
        config.queues.testResults,
        config.queues.artifactProcessing,
      ],
    });
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

  async publishToQueue(queue: string, message: any): Promise<boolean> {
    if (!this.channel) {
      logger.error('Cannot publish: channel not initialized');
      return false;
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(message));
      const result = this.channel.sendToQueue(queue, messageBuffer, {
        persistent: true,
        timestamp: Date.now(),
      });

      if (result) {
        logger.info('Message published to queue', { queue, messageId: message.id });
      } else {
        logger.warn('Queue buffer full, message not published', { queue });
      }

      return result;
    } catch (error) {
      logger.error('Failed to publish message', { queue, error });
      return false;
    }
  }

  async consumeQueue(
    queue: string,
    handler: (message: any) => Promise<void>
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized');
    }

    await this.channel.prefetch(1);

    await this.channel.consume(queue, async (msg) => {
      if (!msg) return;

      try {
        const content = JSON.parse(msg.content.toString());
        logger.info('Processing message from queue', { queue, messageId: content.id });

        await handler(content);

        this.channel?.ack(msg);
        logger.info('Message processed successfully', { queue, messageId: content.id });
      } catch (error) {
        logger.error('Error processing message', { queue, error });
        
        // Reject and requeue message
        this.channel?.nack(msg, false, true);
      }
    });

    logger.info('Started consuming queue', { queue });
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

  getChannel(): amqp.Channel | null {
    return this.channel;
  }
}

export const rabbitmqService = new RabbitMQService();
