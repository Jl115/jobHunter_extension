/**
 * Shared domain contracts used across the extension.
 * No business logic here — only pure data shapes.
 *
 * NOTE: The extension sends RAW HTML only. Field extraction
 * (title, company, location, description) is done by the Python
 * backend using a local LLM (Gemma 4B GGUF).
 */

export interface JobPayload {
  url: string;
  source: string;
  title: string;       // page title (from Readability.js or document.title)
  html: string;        // Readability.cleaned HTML or raw body fallback
  scraped_at: string;
}

export interface ScrapedJob extends JobPayload {
  id: string;
  synced: boolean;
  sync_error?: string;
}

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'failed' | 'queued';

export interface PendingJob {
  payload: JobPayload;
  attempts: number;
  last_error?: string;
  enqueued_at: string;
}
