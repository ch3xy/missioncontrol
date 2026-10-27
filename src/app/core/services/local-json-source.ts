/** A source that accepts the connection but never answers must not block a refresh for minutes. */
export const FETCH_TIMEOUT_MS = 15_000;

export interface LocalJsonResult<T> {
  data: T | null;
  error?: 'empty-url' | 'network' | 'http' | 'invalid-shape';
}

export async function readLocalJson<T>(
  url: string | undefined,
  isValid: (value: unknown) => value is T,
): Promise<T | null> {
  const result = await readLocalJsonResult(url, isValid);
  return result.data;
}

export async function readLocalJsonResult<T>(
  url: string | undefined,
  isValid: (value: unknown) => value is T,
): Promise<LocalJsonResult<T>> {
  if (!url?.trim()) {
    return { data: null, error: 'empty-url' };
  }

  let response: Response;

  try {
    response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  } catch {
    return { data: null, error: 'network' };
  }

  if (!response.ok) {
    return { data: null, error: 'http' };
  }

  try {
    const payload: unknown = await response.json();
    return isValid(payload) ? { data: payload } : { data: null, error: 'invalid-shape' };
  } catch {
    // e.g. an HTML fallback page instead of JSON
    return { data: null, error: 'invalid-shape' };
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
