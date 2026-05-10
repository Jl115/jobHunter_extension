/**
 * Infrastructure config — single source of truth for external endpoints and defaults.
 */
import { DEFAULT_API_PORT, API_VERSION } from '../shared/constants';

export class Config {
  static getApiBaseUrl(port?: number): string {
    const resolved = port ?? DEFAULT_API_PORT;
    return `http://localhost:${resolved}/api/${API_VERSION}`;
  }

  /** Endpoint for raw HTML capture payloads. */
  static get jobsEndpoint(): string {
    return '/jobs/capture';
  }
}
