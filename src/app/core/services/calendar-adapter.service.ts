import { Injectable, inject, signal } from '@angular/core';
import { IntegrationStatus, MOCK_STATUS } from '../models/integration-status.model';
import { CalendarAdapter, CalendarEvent } from '../models/calendar.model';
import { MOCK_CALENDAR_EVENTS } from '../mock-data/calendar.mock';
import { readLocalJsonResult, isRecord } from './local-json-source';
import { SettingsService } from './settings.service';

@Injectable({ providedIn: 'root' })
export class CalendarAdapterService implements CalendarAdapter {
  private readonly settingsService = inject(SettingsService);
  private readonly statusState = signal<IntegrationStatus>(MOCK_STATUS);

  readonly status = this.statusState.asReadonly();

  async getEvents(): Promise<CalendarEvent[]> {
    const settings = this.settingsService.settings();

    if (settings.calendarSource !== 'local-json') {
      this.statusState.set({
        ...MOCK_STATUS,
        message:
          settings.calendarSource === 'ics'
            ? 'ICS is configured as a placeholder; using mock data until the ICS adapter is added.'
            : MOCK_STATUS.message,
      });
      return this.sortEvents(MOCK_CALENDAR_EVENTS);
    }

    const result = await readLocalJsonResult(settings.calendarSourceUrl, isCalendarEventCollection);

    if (result.data) {
      this.statusState.set({
        kind: 'local-json',
        label: 'Local JSON',
        message: 'Loaded calendar events from the configured local JSON URL.',
        requestedUrl: settings.calendarSourceUrl,
      });
      return this.sortEvents(result.data);
    }

    this.statusState.set({
      kind: 'fallback',
      label: 'Mock fallback',
      message: fallbackMessage(result.error),
      requestedUrl: settings.calendarSourceUrl,
    });
    return this.sortEvents(MOCK_CALENDAR_EVENTS);
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

function fallbackMessage(error: string | undefined): string {
  if (error === 'empty-url') {
    return 'No calendar JSON URL is configured; using mock data.';
  }

  if (error === 'invalid-shape') {
    return 'Calendar JSON did not match the expected shape; using mock data.';
  }

  return 'Calendar JSON could not be loaded; using mock data.';
}
