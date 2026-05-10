/**
 * Triggers a manual/forced capture on the currently active tab.
 * Works on ANY website (company career sites, unknown job boards, etc.).
 * Bypasses URL pattern matching.
 */

import { useState } from 'react';
import browser from 'webextension-polyfill';

export function ManualScrapeButton() {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function handleClick() {
    setBusy(true);
    setDone(false);
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        // Send FORCE_CAPTURE to capture any page regardless of URL pattern
        await browser.tabs.sendMessage(tab.id, { type: 'FORCE_CAPTURE' });
        setDone(true);
      }
    } catch {
      setDone(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="manual-scrape">
      <button onClick={handleClick} disabled={busy}>
        {busy ? 'Capturing…' : 'Capture Current Page'}
      </button>
      {done && <span className="done-check">Captured!</span>}
    </div>
  );
}
