/**
 * Typed message bus for content script ↔ background worker communication.
 * Infrastructure wrapper around browser.runtime.sendMessage / onMessage.
 */
import browser from 'webextension-polyfill';
import { JobPayload, PendingJob, SyncStatus } from '../shared/types';
import { MESSAGES } from '../shared/constants';

export type MessageType =
  | typeof MESSAGES.JOB_SCRAPED
  | typeof MESSAGES.GET_PENDING_JOBS
  | typeof MESSAGES.GET_RECENT_JOBS
  | typeof MESSAGES.FORCE_SYNC
  | typeof MESSAGES.GET_STATUS;

export interface MessagePayloads {
  [MESSAGES.JOB_SCRAPED]: { payload: JobPayload };
  [MESSAGES.GET_PENDING_JOBS]: undefined;
  [MESSAGES.GET_RECENT_JOBS]: undefined;
  [MESSAGES.FORCE_SYNC]: undefined;
  [MESSAGES.GET_STATUS]: undefined;
}

export interface MessageResponses {
  [MESSAGES.JOB_SCRAPED]: { success: boolean; queued: boolean };
  [MESSAGES.GET_PENDING_JOBS]: { pending: PendingJob[] };
  [MESSAGES.GET_RECENT_JOBS]: { jobs: JobPayload[] };
  [MESSAGES.FORCE_SYNC]: { success: boolean; syncedCount: number };
  [MESSAGES.GET_STATUS]: { ready: boolean; status: SyncStatus; pendingCount: number };
}

export class MessageBus {
  async send<T extends MessageType>(
    type: T,
    payload: MessagePayloads[T]
  ): Promise<MessageResponses[T]> {
    return await browser.runtime.sendMessage({ type, payload });
  }

  on<T extends MessageType>(
    type: T,
    handler: (payload: MessagePayloads[T]) => Promise<MessageResponses[T]>
  ): () => void {
    const listener = (message: unknown): Promise<unknown> | undefined => {
      if (typeof message === 'object' && message !== null && (message as Record<string, unknown>).type === type) {
        return handler((message as Record<string, unknown>).payload as MessagePayloads[T]) as Promise<unknown>;
      }
      return undefined;
    };
    browser.runtime.onMessage.addListener(listener);
    return () => browser.runtime.onMessage.removeListener(listener);
  }
}

export const messageBus = new MessageBus();
