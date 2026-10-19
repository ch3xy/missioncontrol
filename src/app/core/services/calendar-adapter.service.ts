import { Injectable, inject, signal } from '@angular/core';
import { IntegrationStatus, MOCK_STATUS } from '../models/integration-status.model';
import { CalendarAdapter, CalendarEvent } from '../models/calendar.model';
import { MOCK_CALENDAR_EVENTS } from '../mock-data/calendar.mock';
import { parseIcsEvents } from './ics-parser';
import { readLocalJsonResult, isRecord } from './local-json-source';
import { SettingsService } from './settings.service';
import { TranslationKey } from '../i18n/translations';

@Injectable({ providedIn: 'root' })
export class CalendarAdapterService implements CalendarAdapter {
  private readonly settingsService = inject(SettingsService);
  private readonly statusState = signal<IntegrationStatus>(MOCK_STATUS);

  readonly status = this.statusState.asReadonly();

  async getEvents(): Promise<CalendarEvent[]> {
    const settings = this.settingsService.settings();

    if (settings.calendarSource === 'ics') {
      return this.loadIcsEvents(settings.calendarSourceUrl);
    }

    if (settings.calendarSource !== 'local-json') {
      this.statusState.set(MOCK_STATUS);
      return this.sortEvents(MOCK_CALENDAR_EVENTS);
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
      kind: 'fallback',
      message: fallbackMessage(result.error),
      requestedUrl: settings.calendarSourceUrl,
    });
    return this.sortEvents(MOCK_CALENDAR_EVENTS);
  }

  private async loadIcsEvents(url: string | undefined): Promise<CalendarEvent[]> {
    if (!url?.trim()) {
      this.statusState.set({
        kind: 'fallback',
        message: 'status.calendar.icsEmptyUrl',
      });
      return this.sortEvents(MOCK_CALENDAR_EVENTS);
    }

    try {
      const response = await fetch(url);

      if (!response.ok) {
        this.statusState.set({
          kind: 'fallback',
          message: 'status.calendar.icsFailed',
          requestedUrl: url,
        });
        return this.sortEvents(MOCK_CALENDAR_EVENTS);
      }

      const events = parseIcsEvents(await response.text());

      if (events.length === 0) {
        this.statusState.set({
          kind: 'fallback',
          message: 'status.calendar.icsNoEvents',
          requestedUrl: url,
        });
        return this.sortEvents(MOCK_CALENDAR_EVENTS);
      }

      this.statusState.set({
        kind: 'ics',
        message: 'status.calendar.icsLoaded',
        requestedUrl: url,
      });
      return this.sortEvents(events);
    } catch {
      this.statusState.set({
        kind: 'fallback',
        message: 'status.calendar.icsFailed',
        requestedUrl: url,
      });
      return this.sortEvents(MOCK_CALENDAR_EVENTS);
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
  return value === 'mock' || value === 'ics' || value === 'local-json';
}

function optionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string';
}

function fallbackMessage(error: string | undefined): TranslationKey {
  if (error === 'empty-url') {
    return 'status.calendar.jsonEmptyUrl';
  }

  if (error === 'invalid-shape') {
    return 'status.calendar.jsonInvalidShape';
  }

  return 'status.calendar.jsonFailed';
}
