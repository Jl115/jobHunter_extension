/**
 * Offline queue implemented on top of browser.storage.local.
 */

import { IQueueManager } from './contracts';
import { PendingJob } from '../../../shared/types';
import { STORAGE_KEYS } from '../../../shared/constants';
import { storage } from '../../../infrastructure/storage';

export class QueueManager implements IQueueManager {
  private readonly key = STORAGE_KEYS.PENDING_JOBS;

  async enqueue(job: PendingJob): Promise<void> {
    const current = await this.getAll();
    const filtered = current.filter((j) => j.payload.url !== job.payload.url);
    filtered.push(job);
    await storage.set(this.key, filtered);
  }

  async dequeue(jobId: string): Promise<void> {
    const current = await this.getAll();
    const filtered = current.filter((j) => j.payload.url !== jobId);
    await storage.set(this.key, filtered);
  }

  async getAll(): Promise<PendingJob[]> {
    const raw = await storage.get<PendingJob[]>(this.key);
    return raw ?? [];
  }

  async clear(): Promise<void> {
    await storage.remove(this.key);
  }
}
