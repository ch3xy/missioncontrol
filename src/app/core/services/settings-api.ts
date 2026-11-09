import { Injectable } from '@angular/core';
import { FETCH_TIMEOUT_MS, isRecord } from './local-json-source';

/**
 * Resolved against <base href>: `/api/v1/settings` in development (proxied to the backend),
 * `/missioncontrol/api/v1/settings` on the server (Caddy forwards it to the backend).
 */
export function settingsApiUrl(): string {
  return new URL('api/v1/settings', document.baseURI).href;
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
    return this.request({ headers: { Accept: 'application/json' }, cache: 'no-store' });
  }

  async put(body: unknown): Promise<SettingsApiResult> {
    return this.request({
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
  }

  private async request(init: RequestInit): Promise<SettingsApiResult> {
    let response: Response;

    try {
      response = await fetch(settingsApiUrl(), {
        ...init,
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
    } catch {
      return { kind: 'unavailable' };
    }

    if (response.status === 403) {
      return { kind: 'forbidden' };
    }

    // Refused by a reachable backend, with RFC 7807 Problem Details: 400 unreadable JSON,
    // 409 conflict, 422 validation
    if ([400, 409, 422].includes(response.status)) {
      return { kind: 'invalid', detail: await problemDetail(response) };
    }

    if (!response.ok) {
      return { kind: 'unavailable' };
    }

    try {
      return { kind: 'ok', payload: await response.json() };
    } catch {
      // e.g. an HTML fallback page instead of JSON
      return { kind: 'unavailable' };
    }
  }
}

async function problemDetail(response: Response): Promise<string> {
  try {
    const payload: unknown = await response.json();
    return isRecord(payload) && typeof payload['detail'] === 'string' ? payload['detail'] : '';
  } catch {
    return '';
  }
}
