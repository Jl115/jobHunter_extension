/**
 * Shared constants.
 * No mutable state or logic.
 */

export const DEFAULT_API_PORT = 8080;
export const API_VERSION = 'v1';

export const STORAGE_KEYS = {
  PENDING_JOBS: 'pending_jobs',
  API_PORT: 'api_port',
  RECENT_JOBS: 'recent_jobs_v2',
  SETTINGS: 'jh_settings',
} as const;

export const JOB_BOARD_PATTERNS = {
  LINKEDIN: /^https:\/\/.*\.linkedin\.com/,
  INDEED: /^https:\/\/.*\.indeed\.com/,
  XING: /^https:\/\/.*\.xing\.com/,
} as const;

export const MESSAGES = {
  JOB_SCRAPED: 'JOB_SCRAPED',
  GET_PENDING_JOBS: 'GET_PENDING_JOBS',
  GET_RECENT_JOBS: 'GET_RECENT_JOBS',
  FORCE_SYNC: 'FORCE_SYNC',
  GET_STATUS: 'GET_STATUS',
} as const;
