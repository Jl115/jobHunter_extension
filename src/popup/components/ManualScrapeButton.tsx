/**
 * Triggers a manual scrape on the currently active tab.
 * Used from popup when auto-detection misses a page.
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
        await browser.tabs.sendMessage(tab.id, { type: 'MANUAL_SCRAPE' });
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
        {busy ? 'Scraping…' : 'Scrape Current Page'}
      </button>
      {done && <span className="done-check">Done!</span>}
    </div>
  );
}
