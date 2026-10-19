import { Injectable, inject, signal } from '@angular/core';
import { IntegrationStatus } from '../models/integration-status.model';
import { CalendarAdapter, CalendarEvent } from '../models/calendar.model';
import { parseIcsEvents } from './ics-parser';
import { readLocalJsonResult, isRecord } from './local-json-source';
import { SettingsService } from './settings.service';
import { TranslationKey } from '../i18n/translations';

@Injectable({ providedIn: 'root' })
export class CalendarAdapterService implements CalendarAdapter {
  private readonly settingsService = inject(SettingsService);
  private readonly statusState = signal<IntegrationStatus | null>(null);

  readonly status = this.statusState.asReadonly();

  /** Empty when no source is configured or the source failed; see `status`. */
  async getEvents(): Promise<CalendarEvent[]> {
    const settings = this.settingsService.settings();

    if (settings.calendarSource === 'ics') {
      return this.loadIcsEvents(settings.calendarSourceUrl);
    }

    if (settings.calendarSource !== 'local-json') {
      this.statusState.set({ kind: 'unconfigured', message: 'status.calendar.unconfigured' });
      return [];
    }

    const result = await readLocalJsonResult(settings.calendarSourceUrl, isCalendarEventCollection);

    if (result.data) {
      this.statusState.set({
        kind: 'local-json',
        message: 'status.calendar.localJsonLoaded',
        requestedUrl: settings.calendarSourceUrl,
      });
      return this.sortEvents(result.data);
    }

    this.statusState.set({
      kind: result.error === 'empty-url' ? 'unconfigured' : 'error',
      message: errorMessage(result.error),
      requestedUrl: settings.calendarSourceUrl,
    });
    return [];
  }

  private async loadIcsEvents(url: string | undefined): Promise<CalendarEvent[]> {
    if (!url?.trim()) {
      this.statusState.set({
        kind: 'unconfigured',
        message: 'status.calendar.icsEmptyUrl',
      });
      return [];
    }

    try {
      const response = await fetch(url);

      if (!response.ok) {
        this.statusState.set({
          kind: 'error',
          message: 'status.calendar.icsFailed',
          requestedUrl: url,
        });
        return [];
      }

      const events = parseIcsEvents(await response.text());

      if (events.length === 0) {
        this.statusState.set({
          kind: 'error',
          message: 'status.calendar.icsNoEvents',
          requestedUrl: url,
        });
        return [];
      }

      this.statusState.set({
        kind: 'ics',
        message: 'status.calendar.icsLoaded',
        requestedUrl: url,
      });
      return this.sortEvents(events);
    } catch {
      this.statusState.set({
        kind: 'error',
        message: 'status.calendar.icsFailed',
        requestedUrl: url,
      });
      return [];
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

function errorMessage(error: string | undefined): TranslationKey {
  if (error === 'empty-url') {
    return 'status.calendar.jsonEmptyUrl';
  }

  if (error === 'invalid-shape') {
    return 'status.calendar.jsonInvalidShape';
  }

  return 'status.calendar.jsonFailed';
}
