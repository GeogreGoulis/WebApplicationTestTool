/**
 * Test execution and result types
 */

import { UUID, Timestamp, JSONObject } from './common.types';
import { BrowserType } from './test-suite.types';

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PASSED = 'passed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout',
}

export enum TriggerSource {
  MANUAL = 'manual',
  SCHEDULED = 'scheduled',
  WEBHOOK = 'webhook',
  API = 'api',
}

export interface TestExecution {
  id: UUID;
  suiteId: UUID;
  environmentId: UUID;
  status: ExecutionStatus;
  triggeredBy: UUID;
  triggerSource: TriggerSource;
  browsers: BrowserType[];
  parallelCount: number;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  duration?: number;
  metadata: JSONObject;
  createdAt: Timestamp;
}

export interface CreateExecutionDTO {
  suiteId: UUID;
  environmentId: UUID;
  browsers: BrowserType[];
  parallelCount?: number;
  triggerSource?: TriggerSource;
  metadata?: JSONObject;
}

export interface TestResult {
  id: UUID;
  executionId: UUID;
  scriptId: UUID;
  browser: BrowserType;
  status: ExecutionStatus;
  duration: number;
  errorMessage?: string;
  stackTrace?: string;
  retryAttempt: number;
  createdAt: Timestamp;
}

export interface ExecutionSummary {
  executionId: UUID;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  passRate: number;
  startedAt: Timestamp;
  completedAt: Timestamp;
}

export interface TestLog {
  id: UUID;
  executionId: UUID;
  resultId?: UUID;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  metadata?: JSONObject;
  timestamp: Timestamp;
}

export interface SelfHealingEvent {
  stepName: string;
  originalLocator: string;
  healedLocator: string;
  confidence: number;
  strategy: string;
  timestamp: Timestamp;
}
