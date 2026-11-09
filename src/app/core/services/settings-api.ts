import { Injectable } from '@angular/core';
import { backendRequest, backendUrl } from './backend-request';

export function settingsApiUrl(): string {
  return backendUrl('settings');
}

export type SettingsApiResult =
  | { kind: 'ok'; payload: unknown }
  | { kind: 'invalid'; detail: string }
  /** Host or Origin not allowed by the backend (configuration, not the input). */
  | { kind: 'forbidden' }
  | { kind: 'unavailable' };

/** HTTP access to `GET`/`PUT /api/v1/settings` of the mission control backend. */
@Injectable({ providedIn: 'root' })
export class SettingsApi {
  async get(): Promise<SettingsApiResult> {
    return toSettingsResult(await backendRequest('settings', { cache: 'no-store' }));
  }

  async put(body: unknown): Promise<SettingsApiResult> {
    return toSettingsResult(
      await backendRequest('settings', { method: 'PUT', body: JSON.stringify(body) }),
    );
  }
}

function toSettingsResult(result: Awaited<ReturnType<typeof backendRequest>>): SettingsApiResult {
  switch (result.kind) {
    case 'conflict':
      return { kind: 'invalid', detail: result.detail };
    case 'not-found':
      return { kind: 'unavailable' };
    default:
      return result;
  }
}
