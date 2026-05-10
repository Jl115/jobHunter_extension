# Job Hunter Extension

A Chrome Extension (Manifest V3) that automatically captures job postings from LinkedIn, Indeed, and Xing using [Readability.js](https://github.com/mozilla/readability), then syncs the raw HTML to a local FastAPI backend for AI-powered field extraction.

## What It Does

### Automatic Capture (Known Job Boards)
When you browse a job posting on **LinkedIn, Indeed, or Xing**, the extension automatically:

1. **Detects** job-posting URLs (e.g., `/jobs/view/`, `/viewjob`, `/jobs/...-\d+`)
2. **Waits** for the SPA DOM to settle via a debounced `MutationObserver`
3. **Captures** the clean article HTML using Mozilla's Readability.js
4. **Sends** `{url, source, title, html, scraped_at}` to the local FastAPI server

### Manual Capture (Any Website)
For **company career sites** (e.g., `careers.apple.com`, `jobs.google.com`) or any other job board:

1. Visit the job posting page
2. Click the extension icon → **"Capture Current Page"**
3. The extension bypasses URL checks and captures the page HTML via Readability.js
4. The backend LLM extracts structured fields regardless of the site

The extension does **NOT** extract structured fields (title, company, location, description) from the DOM. That is handled by the Python backend using a local LLM (Gemma 4B GGUF), making the extension resilient to any DOM changes by any job board or company site.

## Tech Stack

| Technology | Purpose |
|------------|---------|
| TypeScript | Type-safe extension code |
| React 19 + Vite | Popup UI with HMR |
| `@mozilla/readability` | Clean article HTML extraction |
| `webextension-polyfill` | Cross-browser API compatibility |
| `vite-plugin-web-extension` | Multi-entry MV3 build |
| Chrome Manifest V3 | Modern extension standard |

## Architecture

```
src/
├── background.ts              # Service Worker: receives captures, syncs to API
├── content/
│   ├── index.ts               # Content script: URL detection + observer orchestration
│   ├── capture.ts             # Readability.js wrapper: extracts clean HTML
│   └── debug-overlay.ts       # In-page badge: scanning / done / error
├── popup/
│   ├── App.tsx                # Popup shell
│   └── components/
│       ├── ConnectionStatus.tsx    # API health indicator
│       ├── PendingJobsList.tsx     # URLs waiting to sync
│       ├── ManualScrapeButton.tsx  # Force re-capture
│       └── SettingsPanel.tsx       # Port & API URL config
├── features/
│   └── sync/
│       ├── index.ts               # Public API
│       └── internal/
│           ├── api-client.ts      # POST to localhost:PORT/api/v1/jobs/capture
│           ├── queue-manager.ts   # Offline queue (browser.storage.local)
│           ├── retry-policy.ts    # Exponential backoff
│           └── sync-service.ts    # Orchestrates sync + two-tier storage
├── infrastructure/
│   ├── storage.ts             # browser.storage.local abstraction
│   ├── messaging.ts           # Typed message bus (content ↔ background)
│   └── config.ts              # API endpoint config
└── shared/
    ├── types.ts               # JobPayload {url, source, title, html, scraped_at}
    └── constants.ts           # Domain regexes, storage keys
```

### Two-Tier Storage

| Storage Key | Contents | HTML? | Purpose |
|-------------|----------|-------|---------|
| `pending_jobs` | Full `PendingJob` objects | ✅ Yes | Queue for retry/sync |
| `recent_jobs_v2` | Lightweight metadata | ❌ No (`html: ''`) | Popup display (saves ~5–10 MB quota) |

## Build & Development

```bash
# Install dependencies
npm install

# Development mode (watches for changes)
npm run dev

# Production build
npm run build

# The dist/ folder is ready to load in Chrome:
# chrome://extensions/ → Load unpacked → select dist/
```

## Data Flow

```
User opens Job Page (LinkedIn/Indeed/Xing)
        |
        v
[Content Script] detects job-posting URL
        |
        v
[Readability.js] captures clean article HTML
        |
        v
[Background SW] receives {url, source, title, html, scraped_at}
        |
        +-- Save lightweight metadata to recent_jobs_v2 (popup)
        +-- If offline: save FULL HTML to pending_jobs queue
        |
        v
POST /api/v1/jobs/capture → FastAPI backend
        |
        v
[Python Backend] stores HTML + runs LLM extraction
```

## Permissions

| Permission | Justification |
|------------|---------------|
| `activeTab` | Read current tab DOM when user triggers capture |
| `host_permissions` | Run on `linkedin.com/*`, `indeed.com/*`, `xing.com/*` |
| `storage` | Cache captures locally before sync |
| `background` | Service worker for API communication |

## License

This extension is licensed under a custom license:

- **Free** for educational, personal, and non-commercial use
- **Commercial use requires a paid license** — contact the author for licensing

See [LICENSE](./LICENSE) for full terms.

## Related

- [Desktop App README](../job_hunter/README.md) — Python PySide6 + FastAPI backend
- [Architecture Docs](../ARCHITECTURE.md) — Full project architecture
- [API Contract](../doc/api-contract.md) — FastAPI endpoint specifications
