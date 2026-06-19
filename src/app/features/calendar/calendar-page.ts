import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { CalendarEvent } from '../../core/models/calendar.model';
import { CalendarAdapterService } from '../../core/services/calendar-adapter.service';
import { WidgetCard } from '../../shared/components/widget-card/widget-card';

@Component({
  selector: 'app-calendar-page',
  imports: [DatePipe, WidgetCard],
  templateUrl: './calendar-page.html',
  styleUrl: './calendar-page.css',
})
export class CalendarPage {
  private readonly calendarAdapter = inject(CalendarAdapterService);
  protected readonly events = signal<CalendarEvent[]>([]);

  constructor() {
    void this.calendarAdapter.getEvents().then((events) => this.events.set(events));
  }
}
