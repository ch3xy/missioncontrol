import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { CalendarEvent } from '../../core/models/calendar.model';
import { CalendarAdapterService } from '../../core/services/calendar-adapter.service';
import { IntegrationNotice } from '../../shared/components/integration-notice/integration-notice';
import { SourceBadge } from '../../shared/components/source-badge/source-badge';
import { WidgetCard } from '../../shared/components/widget-card/widget-card';

@Component({
  selector: 'app-calendar-page',
  imports: [DatePipe, IntegrationNotice, SourceBadge, WidgetCard],
  templateUrl: './calendar-page.html',
  styleUrl: './calendar-page.css',
})
export class CalendarPage {
  private readonly calendarAdapter = inject(CalendarAdapterService);
  protected readonly status = this.calendarAdapter.status;
  protected readonly events = signal<CalendarEvent[]>([]);
  protected readonly source = signal<CalendarEvent['source']>('mock');
  protected readonly isLoading = signal(false);
  protected readonly lastUpdated = signal<Date | null>(null);

  constructor() {
    void this.load();
  }

  protected refresh(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    this.isLoading.set(true);
    const events = await this.calendarAdapter.getEvents();
    this.events.set(events);
    this.source.set(events[0]?.source ?? 'mock');
    this.lastUpdated.set(new Date());
    this.isLoading.set(false);
  }
}
