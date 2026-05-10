/**
 * Sync Feature — Public API.
 * Other features / UI import ONLY from this file.
 */

import { SyncService } from './internal/sync-service';

export type { ISyncService } from './internal/contracts';
export { SyncService } from './internal/sync-service';

/**
 * Singleton instance of the sync service.
 */
export const syncService = new SyncService();
