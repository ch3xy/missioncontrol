/** A source URL field may hold several URLs, one per line; blank lines are ignored. */
export function splitSourceUrls(value: string | undefined): string[] {
  return (value ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Absolute http(s) URLs or paths on this host (`/missioncontrol/calendars/work.ics`), e.g. files a
 * sync job on the server writes next to mission control.
 */
export function isSourceUrl(value: string): boolean {
  return (value.startsWith('/') && !value.startsWith('//')) || isHttpUrl(value);
}

/**
 * Absolute http(s) URL without user name or password: settings live in LocalStorage and end up
 * in exported backups, so they must not carry credentials.
 */
export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      (url.protocol === 'http:' || url.protocol === 'https:') && !url.username && !url.password
    );
  } catch {
    return false;
  }
}
