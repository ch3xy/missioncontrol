import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { LucideRefreshCw } from '@lucide/angular';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { CalendarEvent } from '../../core/models/calendar.model';
import { CalendarAdapterService } from '../../core/services/calendar-adapter.service';
import { IntegrationNotice } from '../../shared/components/integration-notice/integration-notice';
import { SourceBadge } from '../../shared/components/source-badge/source-badge';
import { WidgetCard } from '../../shared/components/widget-card/widget-card';

interface CalendarEventGroup {
  dateKey: string;
  events: CalendarEvent[];
}

@Component({
  selector: 'app-calendar-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, IntegrationNotice, SourceBadge, WidgetCard, LucideRefreshCw, TranslatePipe],
  templateUrl: './calendar-page.html',
  styleUrl: './calendar-page.scss',
})
export class CalendarPage {
  protected readonly i18n = inject(I18nService);
  private readonly calendarAdapter = inject(CalendarAdapterService);
  protected readonly status = this.calendarAdapter.status;
  protected readonly statusLabel = computed(() => {
    const status = this.status();
    return status ? this.i18n.t(`status.${status.kind}`) : '';
  });
  protected readonly events = signal<CalendarEvent[]>([]);
  protected readonly source = computed(() => this.events()[0]?.source ?? null);
  protected readonly hasSource = computed(
    () => this.status()?.kind === 'ics' || this.status()?.kind === 'local-json',
  );
  protected readonly isLoading = signal(false);
  protected readonly lastUpdated = signal<Date | null>(null);
  protected readonly eventGroups = computed<CalendarEventGroup[]>(() => {
    const groups = new Map<string, CalendarEvent[]>();

    for (const event of this.events()) {
      const key = event.startsAt.slice(0, 10);
      groups.set(key, [...(groups.get(key) ?? []), event]);
    }

    return Array.from(groups.entries()).map(([dateKey, events]) => ({
      dateKey,
      events,
    }));
  });

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
    this.lastUpdated.set(new Date());
    this.isLoading.set(false);
  }
}
