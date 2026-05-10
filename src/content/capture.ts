/**
 * Readability-based job page capture.
 *
 * Uses @mozilla/readability to extract the main article content from the DOM.
 * Falls back to raw body.innerHTML if Readability fails.
 *
 * The extension sends only { url, source, title, html, scraped_at }
 * to the background. Field extraction (title, company, location, description)
 * is done later by the Python backend using a local LLM.
 */

import { Readability } from '@mozilla/readability';
import { JobPayload } from '../shared/types';

const JOB_PATH_PATTERNS: Record<string, RegExp> = {
  linkedin: /\/jobs\/view\//,
  indeed: /\/viewjob|\/job\?/i,
  xing: /\/jobs\/[^/]+-\d+/,
};

function detectSource(url: string): string {
  if (url.includes('linkedin.com')) return 'linkedin';
  if (url.includes('indeed.com')) return 'indeed';
  if (url.includes('xing.com')) return 'xing';
  return 'unknown';
}

export function looksLikeJobPosting(url: string): boolean {
  const source = detectSource(url);
  const pattern = JOB_PATH_PATTERNS[source];
  if (!pattern) return false;
  return pattern.test(url);
}

/**
 * Capture the current page using Readability.js.
 * Returns null if the URL doesn't look like a job posting.
 */
export function captureJobPage(): JobPayload | null {
  const url = window.location.href;

  if (!looksLikeJobPosting(url)) {
    console.log('[JobHunter] Not a job-posting URL → skipping capture');
    return null;
  }

  const source = detectSource(url);
  console.log(`[JobHunter:${source}] Starting Readability capture`);

  // Clone the document so Readability can mutate it safely
  const clone = document.cloneNode(true) as Document;
  const article = new Readability(clone).parse();

  const html = article?.content || document.body?.innerHTML || '';
  const title = article?.title || document.title || '';

  if (!html) {
    console.warn('[JobHunter] Readability returned empty HTML, falling back to body.innerHTML');
  }

  const payload: JobPayload = {
    url,
    source,
    title,
    html,
    scraped_at: new Date().toISOString(),
  };

  console.log(`[JobHunter:${source}] Captured ${html.length} chars, title="${title}"`);
  return payload;
}
