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

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return { data: null, error: 'http' };
    }

    const payload: unknown = await response.json();
    return isValid(payload) ? { data: payload } : { data: null, error: 'invalid-shape' };
  } catch {
    return { data: null, error: 'network' };
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
