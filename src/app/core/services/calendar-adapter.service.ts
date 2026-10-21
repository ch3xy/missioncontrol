import { Injectable, inject, signal } from '@angular/core';
import { IntegrationStatus } from '../models/integration-status.model';
import { CalendarAdapter, CalendarEvent } from '../models/calendar.model';
import { parseIcsEvents } from './ics-parser';
import { readLocalJsonResult, isRecord } from './local-json-source';
import { SettingsService } from './settings.service';
import { splitSourceUrls } from './source-urls';
import { TranslationKey } from '../i18n/translations';

type SourceResult = { events: CalendarEvent[] } | { error: TranslationKey };

@Injectable({ providedIn: 'root' })
export class CalendarAdapterService implements CalendarAdapter {
  private readonly settingsService = inject(SettingsService);
  private readonly statusState = signal<IntegrationStatus | null>(null);

  readonly status = this.statusState.asReadonly();

  /**
   * Empty when no source is configured or every source failed; see `status`. Several URLs (one per
   * line) are loaded in parallel and merged, so one failing calendar does not hide the others.
   */
  async getEvents(): Promise<CalendarEvent[]> {
    const settings = this.settingsService.settings();
    const source = settings.calendarSource;

    if (source === 'none') {
      this.statusState.set({ kind: 'unconfigured', message: 'status.calendar.unconfigured' });
      return [];
    }

    const urls = splitSourceUrls(settings.calendarSourceUrl);

    if (urls.length === 0) {
      this.statusState.set({
        kind: 'unconfigured',
        message: source === 'ics' ? 'status.calendar.icsEmptyUrl' : 'status.calendar.jsonEmptyUrl',
      });
      return [];
    }

    const results = await Promise.all(
      urls.map((url) => (source === 'ics' ? this.loadIcsEvents(url) : this.loadJsonEvents(url))),
    );
    const failedUrls = urls.filter((_, index) => 'error' in results[index]);
    const firstError = results.find((result) => 'error' in result);

    if (!firstError) {
      this.statusState.set({
        kind: source,
        message: source === 'ics' ? 'status.calendar.icsLoaded' : 'status.calendar.localJsonLoaded',
        requestedUrl: urls.join(', '),
      });
    } else {
      this.statusState.set({
        kind: 'error',
        message:
          failedUrls.length < urls.length ? 'status.calendar.partiallyLoaded' : firstError.error,
        requestedUrl: failedUrls.join(', '),
      });
    }

    return this.sortEvents(
      uniqueEvents(results.flatMap((result) => ('events' in result ? result.events : []))),
    );
  }

  private async loadJsonEvents(url: string): Promise<SourceResult> {
    const result = await readLocalJsonResult(url, isCalendarEventCollection);
    return result.data ? { events: result.data } : { error: errorMessage(result.error) };
  }

  private async loadIcsEvents(url: string): Promise<SourceResult> {
    let text: string;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        return { error: 'status.calendar.icsFailed' };
      }

      text = await response.text();
    } catch {
      return { error: 'status.calendar.icsFailed' };
    }

    // An empty calendar is fine; anything else (e.g. an HTML fallback page) is not.
    if (!text.includes('BEGIN:VCALENDAR')) {
      return { error: 'status.calendar.icsInvalid' };
    }

    try {
      return { events: parseIcsEvents(text) };
    } catch {
      return { error: 'status.calendar.icsInvalid' };
    }
  }

  private sortEvents(events: CalendarEvent[]): CalendarEvent[] {
    return [...events].sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );
  }
}

function isCalendarEventCollection(value: unknown): value is CalendarEvent[] {
  return Array.isArray(value) && value.every(isCalendarEvent);
}

function isCalendarEvent(value: unknown): value is CalendarEvent {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value['id'] === 'string' &&
    typeof value['title'] === 'string' &&
    typeof value['startsAt'] === 'string' &&
    isCalendarSource(value['source']) &&
    optionalString(value['endsAt']) &&
    optionalString(value['project']) &&
    optionalString(value['customer']) &&
    optionalString(value['location'])
  );
}

function isCalendarSource(value: unknown): value is CalendarEvent['source'] {
  return value === 'ics' || value === 'local-json';
}

function optionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string';
}

/** The same event can be in several calendars, e.g. an invitation shared by two people. */
function uniqueEvents(events: CalendarEvent[]): CalendarEvent[] {
  const seen = new Set<string>();

  return events.filter((event) => {
    const key = `${event.id}|${event.startsAt}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function errorMessage(error: string | undefined): TranslationKey {
  if (error === 'invalid-shape') {
    return 'status.calendar.jsonInvalidShape';
  }

  return 'status.calendar.jsonFailed';
}
