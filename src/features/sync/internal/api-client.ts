/**
 * HTTP client for posting jobs to the desktop app's local FastAPI server.
 */

import { IApiClient } from './contracts';
import { JobPayload } from '../../../shared/types';
import { Config } from '../../../infrastructure/config';

export class ApiClient implements IApiClient {
  private getEndpoint(): string {
    return `${Config.getApiBaseUrl()}${Config.jobsEndpoint}`;
  }

  async postJob(payload: JobPayload): Promise<{ success: boolean; id?: number }> {
    const response = await fetch(this.getEndpoint(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => 'Unknown error');
      throw new Error(`API error ${response.status}: ${text}`);
    }

    const data = (await response.json()) as { id?: number; message?: string };
    return { success: true, id: data.id };
  }
}
