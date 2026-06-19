export async function readLocalJson<T>(
  url: string | undefined,
  isValid: (value: unknown) => value is T,
): Promise<T | null> {
  if (!url?.trim()) {
    return null;
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const payload: unknown = await response.json();
    return isValid(payload) ? payload : null;
  } catch {
    return null;
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
