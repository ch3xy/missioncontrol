import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { CalendarEvent } from '../../core/models/calendar.model';
import { CalendarAdapterService } from '../../core/services/calendar-adapter.service';
import { SourceBadge } from '../../shared/components/source-badge/source-badge';
import { WidgetCard } from '../../shared/components/widget-card/widget-card';

@Component({
  selector: 'app-calendar-page',
  imports: [DatePipe, SourceBadge, WidgetCard],
  templateUrl: './calendar-page.html',
  styleUrl: './calendar-page.css',
})
export class CalendarPage {
  private readonly calendarAdapter = inject(CalendarAdapterService);
  protected readonly events = signal<CalendarEvent[]>([]);
  protected readonly source = signal<CalendarEvent['source']>('mock');

  constructor() {
    void this.calendarAdapter.getEvents().then((events) => {
      this.events.set(events);
      this.source.set(events[0]?.source ?? 'mock');
    });
  }
}
