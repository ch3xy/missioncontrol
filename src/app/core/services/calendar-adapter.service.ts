import { Injectable, inject } from '@angular/core';
import { CalendarAdapter, CalendarEvent } from '../models/calendar.model';
import { MOCK_CALENDAR_EVENTS } from '../mock-data/calendar.mock';
import { readLocalJson, isRecord } from './local-json-source';
import { SettingsService } from './settings.service';

@Injectable({ providedIn: 'root' })
export class CalendarAdapterService implements CalendarAdapter {
  private readonly settingsService = inject(SettingsService);

  async getEvents(): Promise<CalendarEvent[]> {
    const settings = this.settingsService.settings();
    const localEvents =
      settings.calendarSource === 'mock'
        ? null
        : await readLocalJson(
            settings.calendarSourceUrl,
            isCalendarEventCollection,
          );

    return this.sortEvents(localEvents ?? MOCK_CALENDAR_EVENTS);
  }

  private sortEvents(events: CalendarEvent[]): CalendarEvent[] {
    return [...events].sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
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
