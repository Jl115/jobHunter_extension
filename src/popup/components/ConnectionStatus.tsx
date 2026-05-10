/**
 * Displays API connection readiness and count of pending jobs.
 */

import { useState, useEffect } from 'react';
import { messageBus } from '../../infrastructure/messaging';
import { MESSAGES } from '../../shared/constants';
import type { SyncStatus } from '../../shared/types';

export function ConnectionStatus() {
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await messageBus.send(MESSAGES.GET_STATUS, undefined);
        setStatus(res.status);
        setPendingCount(res.pendingCount);
      } catch {
        setStatus('failed');
      }
    }

    fetchStatus();
    const id = setInterval(fetchStatus, 3_000);
    return () => clearInterval(id);
  }, []);

  const color = status === 'synced' || status === 'idle' ? '#28a745' : status === 'queued' ? '#ffc107' : '#dc3545';
  const label = status === 'idle' ? 'Online' : status === 'queued' ? `${pendingCount} pending` : 'Offline';

  return (
    <div className="connection-status">
      <span className="indicator" style={{ backgroundColor: color }} />
      <span className="label">{label}</span>
    </div>
  );
}
