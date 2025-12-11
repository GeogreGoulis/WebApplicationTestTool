/**
 * Artifact generation and storage types
 */

import { UUID, Timestamp } from './common.types';

export enum ArtifactType {
  VIDEO = 'video',
  SCREENSHOT = 'screenshot',
  TRACE = 'trace',
  LOG = 'log',
  REPORT = 'report',
}

export enum ArtifactMode {
  ALWAYS = 'always',
  ON_FAILURE = 'on-failure',
  PER_STEP = 'per-step',
  NEVER = 'never',
}

export enum VideoFormat {
  WEBM = 'webm',
  MP4 = 'mp4',
}

export enum VideoQuality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export interface ArtifactConfig {
  video: {
    enabled: boolean;
    mode: ArtifactMode;
    format: VideoFormat;
    quality: VideoQuality;
  };
  screenshots: {
    enabled: boolean;
    mode: ArtifactMode;
    fullPage: boolean;
  };
  reports: {
    html: boolean;
    pdf: boolean;
    includeVideos: boolean;
    includeScreenshots: boolean;
  };
  documentation: {
    generateStepDocs: boolean;
    format: 'html' | 'markdown';
  };
}

export interface TestArtifact {
  id: UUID;
  resultId: UUID;
  executionId: UUID;
  type: ArtifactType;
  filePath: string;
  fileName: string;
  sizeBytes: number;
  mimeType: string;
  metadata?: Record<string, unknown>;
  createdAt: Timestamp;
}

export interface CreateArtifactDTO {
  resultId: UUID;
  executionId: UUID;
  type: ArtifactType;
  filePath: string;
  fileName: string;
  sizeBytes: number;
  mimeType: string;
  metadata?: Record<string, unknown>;
}

export interface ArtifactStorageConfig {
  bucket: string;
  region?: string;
  endpoint?: string;
  accessKey?: string;
  secretKey?: string;
  retentionDays: number;
}
