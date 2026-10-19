import { LocalJsonResult, readLocalJsonResult } from './local-json-source';

export type ApiError = NonNullable<LocalJsonResult<unknown>['error']>;

/** Joins a configured base URL (e.g. `https://arrow.local/velo`) with an API path. */
export function apiUrl(baseUrl: string, path: string): string {
  return `${baseUrl.trim().replace(/\/+$/, '')}/${path}`;
}

/** The REST APIs are plain JSON over GET, so the local JSON reader covers them as well. */
export function readApiResult<T>(
  baseUrl: string,
  path: string,
  isValid: (value: unknown) => value is T,
): Promise<LocalJsonResult<T>> {
  return readLocalJsonResult(apiUrl(baseUrl, path), isValid);
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
