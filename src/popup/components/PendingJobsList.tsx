/**
 * List of captured job pages that haven't been synced yet.
 * Shows raw URL + timestamp (no field extraction in extension).
 */

import { useState, useEffect } from 'react';
import { messageBus } from '../../infrastructure/messaging';
import { MESSAGES } from '../../shared/constants';
import type { PendingJob } from '../../shared/types';

export function PendingJobsList() {
  const [pending, setPending] = useState<PendingJob[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState('');

  async function load() {
    try {
      const res = await messageBus.send(MESSAGES.GET_PENDING_JOBS, undefined);
      setPending(res.pending);
    } catch {
      setPending([]);
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 3_000);
    return () => clearInterval(id);
  }, []);

  async function handleForceSync() {
    setSyncing(true);
    setLastResult('');
    try {
      const res = await messageBus.send(MESSAGES.FORCE_SYNC, undefined);
      setLastResult(`Synced ${res.syncedCount} job(s).`);
      await load();
    } catch {
      setLastResult('Sync failed.');
    } finally {
      setSyncing(false);
    }
  }

  if (pending.length === 0 && !lastResult) {
    return <p className="empty">No pending captures. Browse LinkedIn/Indeed/Xing!</p>;
  }

  return (
    <section className="pending-jobs">
      <header>
        <h2>Pending Captures ({pending.length})</h2>
        <button onClick={handleForceSync} disabled={syncing || pending.length === 0}>
          {syncing ? 'Syncing…' : 'Sync Now'}
        </button>
      </header>

      {lastResult && <p className="result">{lastResult}</p>}

      <ul>
        {pending.map((job) => (
          <li key={job.payload.url}>
            <div className="job-url" title={job.payload.url}>
              {job.payload.url}
            </div>
            <div className="job-meta">
              {job.payload.source} · {new Date(job.payload.scraped_at).toLocaleTimeString()}
            </div>
            <div className="job-attempt">Attempt #{job.attempts}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}
