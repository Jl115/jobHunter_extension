/**
 * Sync Feature — Internal Contracts.
 * Strict encapsulation: no other feature imports this file.
 */

import { JobPayload, PendingJob, SyncStatus } from '../../../shared/types';

export interface ISyncService {
  /** Attempt to send a job to the API.  On failure, enqueue it. */
  sendJob(payload: JobPayload): Promise<SyncStatus>;

  /** Flush all pending jobs from queue.  Returns how many were successfully synced. */
  flushQueue(): Promise<number>;

  /** Get current pending jobs. */
  getPendingJobs(): Promise<PendingJob[]>;

  /** Get recently synced / scraped jobs. */
  getRecentJobs(): Promise<JobPayload[]>;
}

export interface IApiClient {
  postJob(payload: JobPayload): Promise<{ success: boolean; id?: number }>;
}

export interface IQueueManager {
  enqueue(job: PendingJob): Promise<void>;
  dequeue(jobId: string): Promise<void>;
  getAll(): Promise<PendingJob[]>;
  clear(): Promise<void>;
}

export interface IRetryPolicy {
  shouldRetry(attempts: number, error: string): boolean;
  getDelayMs(attempts: number): number;
}
