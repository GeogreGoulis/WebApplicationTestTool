import * as Minio from 'minio';
import { config } from '../config';
import { createLogger } from '@watt/shared-utils';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('minio-storage');

export class MinioStorage {
  private client: Minio.Client;

  constructor() {
    this.client = new Minio.Client({
      endPoint: config.minio.endpoint,
      port: config.minio.port,
      useSSL: config.minio.useSSL,
      accessKey: config.minio.accessKey,
      secretKey: config.minio.secretKey,
    });
  }

  async ensureBuckets(): Promise<void> {
    const buckets = Object.values(config.minio.buckets);
    
    for (const bucket of buckets) {
      try {
        const exists = await this.client.bucketExists(bucket);
        if (!exists) {
          await this.client.makeBucket(bucket, 'us-east-1');
          logger.info('Bucket created', { bucket });
        } else {
          logger.info('Bucket already exists', { bucket });
        }
      } catch (error) {
        logger.error('Failed to ensure bucket exists', { bucket, error });
        throw error;
      }
    }
  }

  async uploadFile(
    bucketName: string,
    objectName: string,
    filePath: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      const fileStats = fs.statSync(filePath);
      const metaData = {
        'Content-Type': this.getContentType(filePath),
        ...metadata,
      };

      await this.client.fPutObject(bucketName, objectName, filePath, metaData);

      logger.info('File uploaded to MinIO', {
        bucket: bucketName,
        object: objectName,
        size: fileStats.size,
      });

      return objectName;
    } catch (error) {
      logger.error('Failed to upload file to MinIO', {
        bucket: bucketName,
        object: objectName,
        error,
      });
      throw error;
    }
  }

  async uploadBuffer(
    bucketName: string,
    objectName: string,
    buffer: Buffer,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      const metaData = {
        'Content-Type': 'application/octet-stream',
        ...metadata,
      };

      await this.client.putObject(bucketName, objectName, buffer, buffer.length, metaData);

      logger.info('Buffer uploaded to MinIO', {
        bucket: bucketName,
        object: objectName,
        size: buffer.length,
      });

      return objectName;
    } catch (error) {
      logger.error('Failed to upload buffer to MinIO', {
        bucket: bucketName,
        object: objectName,
        error,
      });
      throw error;
    }
  }

  async getFileUrl(bucketName: string, objectName: string, expiry: number = 3600): Promise<string> {
    try {
      const url = await this.client.presignedGetObject(bucketName, objectName, expiry);
      return url;
    } catch (error) {
      logger.error('Failed to generate presigned URL', {
        bucket: bucketName,
        object: objectName,
        error,
      });
      throw error;
    }
  }

  async deleteFile(bucketName: string, objectName: string): Promise<void> {
    try {
      await this.client.removeObject(bucketName, objectName);
      logger.info('File deleted from MinIO', { bucket: bucketName, object: objectName });
    } catch (error) {
      logger.error('Failed to delete file from MinIO', {
        bucket: bucketName,
        object: objectName,
        error,
      });
      throw error;
    }
  }

  private getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.json': 'application/json',
      '.html': 'text/html',
      '.xml': 'application/xml',
      '.txt': 'text/plain',
      '.pdf': 'application/pdf',
    };

    return contentTypes[ext] || 'application/octet-stream';
  }
}

export const minioStorage = new MinioStorage();
