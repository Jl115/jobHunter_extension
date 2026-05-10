/**
 * Sync Service — orchestrates API client, queue manager, and retry policy.
 * Also maintains a capped list of recent jobs in storage.
 */

import { ISyncService } from './contracts';
import { ApiClient } from './api-client';
import { QueueManager } from './queue-manager';
import { ExponentialRetryPolicy } from './retry-policy';
import { JobPayload, PendingJob, SyncStatus } from '../../../shared/types';
import { STORAGE_KEYS } from '../../../shared/constants';
import { storage } from '../../../infrastructure/storage';

export class SyncService implements ISyncService {
  private readonly api = new ApiClient();
  private readonly queue = new QueueManager();
  private readonly retry = new ExponentialRetryPolicy();

  async sendJob(payload: JobPayload): Promise<SyncStatus> {
    // Save to recent jobs immediately
    await this.recordRecentJob(payload);

    try {
      await this.api.postJob(payload);
      await this.queue.dequeue(payload.url);
      return 'synced';
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      const pending: PendingJob = {
        payload,
        attempts: 1,
        last_error: error,
        enqueued_at: new Date().toISOString(),
      };
      await this.queue.enqueue(pending);
      return 'queued';
    }
  }

  async flushQueue(): Promise<number> {
    const pending = await this.queue.getAll();
    let syncedCount = 0;

    for (const job of pending) {
      if (!this.retry.shouldRetry(job.attempts, job.last_error ?? '')) {
        continue;
      }

      try {
        await this.api.postJob(job.payload);
        await this.queue.dequeue(job.payload.url);
        syncedCount++;
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        const updated: PendingJob = {
          ...job,
          attempts: job.attempts + 1,
          last_error: error,
          enqueued_at: new Date().toISOString(),
        };
        await this.queue.enqueue(updated);
      }
    }

    return syncedCount;
  }

  async getPendingJobs(): Promise<PendingJob[]> {
    return await this.queue.getAll();
  }

  async getRecentJobs(): Promise<JobPayload[]> {
    const raw = await storage.get<JobPayload[]>(STORAGE_KEYS.RECENT_JOBS);
    return raw ?? [];
  }

  private async recordRecentJob(payload: JobPayload): Promise<void> {
    const current = await this.getRecentJobs();
    const filtered = current.filter((j) => j.url !== payload.url);
    filtered.unshift(payload);
    const capped = filtered.slice(0, 50);
    await storage.set(STORAGE_KEYS.RECENT_JOBS, capped);
  }
}
