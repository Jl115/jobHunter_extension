/**
 * Exponential-backoff retry policy.
 */

import { IRetryPolicy } from './contracts';

export class ExponentialRetryPolicy implements IRetryPolicy {
  constructor(
    private readonly maxRetries = 5,
    private readonly baseDelayMs = 1_000,
    private readonly maxDelayMs = 30_000
  ) {}

  shouldRetry(attempts: number, _error: string): boolean {
    return attempts < this.maxRetries;
  }

  getDelayMs(attempts: number): number {
    const delay = this.baseDelayMs * Math.pow(2, attempts);
    return Math.min(delay, this.maxDelayMs);
  }
}
