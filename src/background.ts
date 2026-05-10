/**
 * Background Service Worker.
 *
 * Listens for JOB_SCRAPED messages from content scripts,
 * delegates to SyncService, and exposes status/jobs queries to the popup.
 *
 * NOTE: The payload now contains raw HTML only (no extracted fields).
 * The backend LLM (Gemma 4B GGUF) extracts structured data from the HTML.
 */

import { syncService } from './features/sync';
import { messageBus } from './infrastructure/messaging';
import { MESSAGES } from './shared/constants';

// ── Message Handlers ─────────────────────────────────────────────────────────────

messageBus.on(MESSAGES.JOB_SCRAPED, async ({ payload }) => {
  try {
    const status = await syncService.sendJob(payload);
    console.log('[JobHunter BG] Sync status:', status);

    if (status === 'synced' || status === 'queued') {
      // Attempt to flush any pending queue on every new job
      await syncService.flushQueue();
    }

    return { success: status === 'synced', queued: status === 'queued' };
  } catch (err) {
    console.error('[JobHunter BG] Sync error:', err);
    return { success: false, queued: true };
  }
});

messageBus.on(MESSAGES.GET_PENDING_JOBS, async () => {
  const pending = await syncService.getPendingJobs();
  return { pending };
});

messageBus.on(MESSAGES.GET_RECENT_JOBS, async () => {
  const jobs = await syncService.getRecentJobs();
  return { jobs };
});

messageBus.on(MESSAGES.FORCE_SYNC, async () => {
  const syncedCount = await syncService.flushQueue();
  return { success: syncedCount >= 0, syncedCount };
});

messageBus.on(MESSAGES.GET_STATUS, async () => {
  const pending = await syncService.getPendingJobs();
  const status = pending.length > 0 ? 'queued' : 'idle';
  return {
    ready: true,
    status,
    pendingCount: pending.length,
  };
});

// ── Service Worker Lifecycle ───────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  console.log('[JobHunter BG] Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Keep-alive: some platforms terminate SW aggressively.
if (typeof chrome !== 'undefined' && chrome.alarms) {
  chrome.alarms.create('keepAlive', { periodInMinutes: 4.9 });
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'keepAlive') {
      console.log('[JobHunter BG] Keep-alive ping');
    }
  });
}
