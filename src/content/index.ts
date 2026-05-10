/**
 * Content Script Entry Point (Readability-based).
 *
 * 1. Detects job-posting URLs via simple regex patterns.
 * 2. Waits for DOM to settle using a debounced MutationObserver.
 * 3. Captures the page using Readability.js → extracts clean article HTML.
 * 4. Sends { url, source, title, html, scraped_at } to background worker.
 * 5. Stops observer after capture to save CPU.
 *
 * NO field extraction happens here. The backend LLM extracts
 * title, company, location, description from the raw HTML.
 */

import { captureJobPage, looksLikeJobPosting } from './capture';
import { messageBus } from '../infrastructure/messaging';
import { MESSAGES } from '../shared/constants';
import browser from 'webextension-polyfill';
import { debugScanning, debugSuccess, debugError } from './debug-overlay';

// ── Deduplication guard ──────────────────────────────────────────────────────
const SCRAPED_URLS_KEY = '__jh_scraped_urls__';

async function isAlreadyScraped(url: string): Promise<boolean> {
  try {
    const raw = sessionStorage.getItem(SCRAPED_URLS_KEY);
    const set = raw ? new Set(JSON.parse(raw) as string[]) : new Set<string>();
    return set.has(url);
  } catch {
    return false;
  }
}

async function markScraped(url: string): Promise<void> {
  try {
    const raw = sessionStorage.getItem(SCRAPED_URLS_KEY);
    const set = raw ? new Set(JSON.parse(raw) as string[]) : new Set<string>();
    set.add(url);
    sessionStorage.setItem(SCRAPED_URLS_KEY, JSON.stringify([...set]));
  } catch {
    // sessionStorage may be unavailable in some contexts
  }
}

// ── Orchestrator ───────────────────────────────────────────────────────────────
let detected = false;
let observer: MutationObserver | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let isScraping = false;
let lastUrl = location.href;
let attempts = 0;
const MAX_ATTEMPTS = 30; // give up after ~30 observer firings

async function attemptCapture(): Promise<void> {
  if (detected) return;
  if (isScraping) return;

  const url = window.location.href;

  if (!looksLikeJobPosting(url)) {
    console.log('[JobHunter] Not a job-posting URL → idle');
    return;
  }

  // Wait a moment for SPA content to render
  attempts++;
  if (attempts > MAX_ATTEMPTS) {
    console.log('[JobHunter] Max DOM attempts reached, giving up');
    detected = true;
    observer?.disconnect();
    observer = null;
    return;
  }

  // Try to capture — Readability returns null if the page is still loading
  const payload = captureJobPage();
  if (!payload) {
    console.log(`[JobHunter] Capture returned null (attempt ${attempts}/${MAX_ATTEMPTS}) → waiting...`);
    return;
  }

  // Successful capture — stop observing
  detected = true;
  observer?.disconnect();
  observer = null;

  if (await isAlreadyScraped(url)) {
    console.log('[JobHunter] Already scraped:', url);
    return;
  }

  isScraping = true;
  try {
    console.log(`[JobHunter] Captured ${payload.html.length} chars → sending to background`);
    debugScanning();
    await markScraped(url);
    await messageBus.send(MESSAGES.JOB_SCRAPED, { payload });
    debugSuccess(payload.url);
    console.log('[JobHunter] ✅ Sent to backend:', payload.url, '| source:', payload.source);
  } catch (err) {
    debugError(err);
    console.error('[JobHunter] ❌ Send failed:', err);
    // Reset so user can retry
    detected = false;
    isScraping = false;
  } finally {
    isScraping = false;
  }
}

function debouncedAttempt(): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => void attemptCapture(), 800);
}

// ── Observer lifecycle ──────────────────────────────────────────────────────────
function startObserverIfNeeded(): void {
  if (!looksLikeJobPosting(window.location.href)) {
    console.log('[JobHunter] Not a job-posting URL → no observer');
    return;
  }

  if (observer) return; // Don't duplicate

  console.log('[JobHunter] Job-posting URL detected → starting MutationObserver');

  // Try immediately (for SSR pages)
  void attemptCapture();

  observer = new MutationObserver(() => {
    if (detected || isScraping) return;
    debouncedAttempt();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function stopObserver(): void {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

// ── Navigation handling ────────────────────────────────────────────────────────
function handleNavigation(): void {
  if (location.href === lastUrl) return;

  console.log('[JobHunter] SPA navigation:', lastUrl, '→', location.href);
  lastUrl = location.href;

  detected = false;
  isScraping = false;
  attempts = 0;
  if (debounceTimer) clearTimeout(debounceTimer);
  stopObserver();

  startObserverIfNeeded();
}

function setupNavigationListeners(): void {
  window.addEventListener('popstate', handleNavigation);

  const originalPush = history.pushState.bind(history);
  const originalReplace = history.replaceState.bind(history);

  history.pushState = function (...args) {
    originalPush(...args);
    handleNavigation();
  };

  history.replaceState = function (...args) {
    originalReplace(...args);
    handleNavigation();
  };
}

// ── Manual capture from popup ─────────────────────────────────────────────────
browser.runtime.onMessage.addListener((msg) => {
  console.log('[JobHunter] Received popup message:', msg);
  if (msg && (msg as Record<string, unknown>).type === 'MANUAL_SCRAPE') {
    detected = false;
    isScraping = false;
    attempts = 0;
    startObserverIfNeeded();
  }
  return undefined;
});

// ── Bootstrap ──────────────────────────────────────────────────────────────────
setupNavigationListeners();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startObserverIfNeeded);
} else {
  startObserverIfNeeded();
}
