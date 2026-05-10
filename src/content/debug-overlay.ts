/**
 * Tiny in-page debug overlay.
 * Adds a small fixed badge in the bottom-left so the user
 * can see if the content script is scanning / scraping / done.
 *
 * NOTE: DOM writes are done ONCE on first visible state change.
 * After that only the badge text is updated (no new nodes).
 */

let badge: HTMLDivElement | null = null;
let badgeText: HTMLSpanElement | null = null;
let badgeDots = 0;
let dotInterval: ReturnType<typeof setInterval> | null = null;

/** Insert the badge node into the page (once). */
function ensureBadge(): void {
  if (badge) return;
  if (!document.body) return;

  badge = document.createElement('div');
  badge.id = '__jh_debug_overlay__';
  badge.style.cssText = `
    position: fixed;
    bottom: 12px;
    left: 12px;
    z-index: 2147483647;
    background: #2563eb;
    color: #fff;
    font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    gap: 6px;
    opacity: 0;
    transform: translateY(4px);
    transition: opacity 200ms, transform 200ms;
    pointer-events: none;
    line-height: 1;
  `;

  const icon = document.createElement('span');
  icon.textContent = '🔍';
  icon.style.fontSize = '14px';
  badge.appendChild(icon);

  badgeText = document.createElement('span');
  badgeText.textContent = 'JobHunter idle';
  badge.appendChild(badgeText);

  document.body.appendChild(badge);

  requestAnimationFrame(() => {
    badge!.style.opacity = '1';
    badge!.style.transform = 'translateY(0)';
  });
}

/** Update badge text without creating nodes (safe inside MutationObserver). */
function _updateBadge(label: string): void {
  if (!badgeText) return;
  if (dotInterval) {
    clearInterval(dotInterval);
    dotInterval = null;
  }
  badgeText.textContent = `JobHunter: ${label}`;
}

/* ── Public API ─────────────────────────────────────────────────── */

/** Use for developer-visible progress (injects overlay). */
export function debugLog(label: string): void {
  console.log('[JobHunter]', label);
}

export function debugScanning(): void {
  ensureBadge();
  if (!badgeText) return;
  _updateBadge('scanning');
  dotInterval = setInterval(() => {
    badgeDots = (badgeDots + 1) % 4;
    if (badgeText) {
      badgeText.textContent = 'JobHunter: scanning' + '.'.repeat(badgeDots);
    }
  }, 500);
}

export function debugSuccess(title?: string): void {
  if (dotInterval) { clearInterval(dotInterval); dotInterval = null; }
  const msg = title ? ` scraped “${title}” ✅` : ' scraped ✅';
  ensureBadge();
  _updateBadge(msg);
  console.log('[JobHunter]', msg);
  setTimeout(() => {
    if (badge) {
      badge.style.opacity = '0';
      badge.style.transform = 'translateY(4px)';
    }
  }, 6_000);
}

export function debugError(err: unknown): void {
  if (dotInterval) { clearInterval(dotInterval); dotInterval = null; }
  const msg = err instanceof Error ? err.message : String(err);
  ensureBadge();
  _updateBadge(`error ❌ ${msg.slice(0, 60)}`);
  console.error('[JobHunter] ❌', msg);
}
