import { FETCH_TIMEOUT_MS, isRecord } from './local-json-source';

/**
 * Resolved against <base href>: `/api/v1/...` in development (proxied to the backend),
 * `/missioncontrol/api/v1/...` on the server (Caddy forwards it to the backend).
 */
export function backendUrl(path: string): string {
  return new URL(`api/v1/${path}`, document.baseURI).href;
}

export type BackendResult =
  | { kind: 'ok'; payload: unknown }
  /** 400/422: the input was refused, `detail` from the RFC 7807 Problem Details. */
  | { kind: 'invalid'; detail: string }
  /** 409: the data changed in the meantime (e.g. another device); reload and try again. */
  | { kind: 'conflict'; detail: string }
  /** 404: the entity no longer exists. */
  | { kind: 'not-found' }
  /** 403: Host or Origin not allowed by the backend (configuration, not the input). */
  | { kind: 'forbidden' }
  | { kind: 'unavailable' };

/** JSON request to the mission control backend; `204 No Content` answers with `payload: null`. */
export async function backendRequest(path: string, init: RequestInit = {}): Promise<BackendResult> {
  let response: Response;

  try {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    if (init.body) {
      headers.set('Content-Type', 'application/json');
    }
    response = await fetch(backendUrl(path), {
      ...init,
      headers,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch {
    return { kind: 'unavailable' };
  }

  switch (response.status) {
    case 400:
    case 422:
      return { kind: 'invalid', detail: await problemDetail(response) };
    case 409:
      return { kind: 'conflict', detail: await problemDetail(response) };
    case 403:
      return { kind: 'forbidden' };
    case 404:
      return { kind: 'not-found' };
    case 204:
      return { kind: 'ok', payload: null };
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

async function problemDetail(response: Response): Promise<string> {
  try {
    const payload: unknown = await response.json();
    return isRecord(payload) && typeof payload['detail'] === 'string' ? payload['detail'] : '';
  } catch {
    return '';
  }
}
