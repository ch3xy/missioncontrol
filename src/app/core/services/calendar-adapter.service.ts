import { Injectable } from '@angular/core';
import { CalendarAdapter, CalendarEvent } from '../models/calendar.model';
import { MOCK_CALENDAR_EVENTS } from '../mock-data/calendar.mock';

@Injectable({ providedIn: 'root' })
export class CalendarAdapterService implements CalendarAdapter {
  async getEvents(): Promise<CalendarEvent[]> {
    return [...MOCK_CALENDAR_EVENTS].sort(
      (a, b) =>
        new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );
  }
}
