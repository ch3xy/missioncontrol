import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  LucideCalendarDays,
  LucideChevronLeft,
  LucideChevronRight,
  LucideList,
  LucideRefreshCw,
} from '@lucide/angular';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { CalendarEvent } from '../../core/models/calendar.model';
import { CalendarAdapterService } from '../../core/services/calendar-adapter.service';
import { IntegrationNotice } from '../../shared/components/integration-notice/integration-notice';
import { SourceBadge } from '../../shared/components/source-badge/source-badge';
import { WidgetCard } from '../../shared/components/widget-card/widget-card';
import { buildMonth, eventDayKeys } from './calendar-month';

export type CalendarView = 'month' | 'list';

/** Arrow convention: `<product>-<preference>` (see docs/arrow-corporate-design.md, section 9). */
export const CALENDAR_VIEW_STORAGE_KEY = 'missioncontrol-calendar-view';

/** Events beyond this are summarized as "+N more" in a month cell. */
const MAX_EVENTS_PER_DAY = 3;

interface CalendarEventGroup {
  dateKey: string;
  events: CalendarEvent[];
}

@Component({
  selector: 'app-calendar-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    IntegrationNotice,
    SourceBadge,
    WidgetCard,
    LucideCalendarDays,
    LucideChevronLeft,
    LucideChevronRight,
    LucideList,
    LucideRefreshCw,
    TranslatePipe,
  ],
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
  protected readonly maxEventsPerDay = MAX_EVENTS_PER_DAY;
  protected readonly view = signal<CalendarView>(readView());
  /** First day of the month shown in the month view. */
  protected readonly month = signal(startOfMonth(new Date()));
  protected readonly monthDays = computed(() => buildMonth(this.month(), this.events()));
  protected readonly weekdays = computed(() => this.monthDays().slice(0, 7));
  protected readonly eventGroups = computed<CalendarEventGroup[]>(() => {
    const groups = new Map<string, CalendarEvent[]>();

    for (const event of this.events()) {
      const key = eventDayKeys(event)[0];
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

  protected setView(view: CalendarView): void {
    this.view.set(view);
    try {
      globalThis.localStorage?.setItem(CALENDAR_VIEW_STORAGE_KEY, view);
    } catch {
      /* storage unavailable — keep the view for this session only */
    }
  }

  protected moveMonth(offset: number): void {
    const month = this.month();
    this.month.set(new Date(month.getFullYear(), month.getMonth() + offset, 1));
  }

  protected showCurrentMonth(): void {
    this.month.set(startOfMonth(new Date()));
  }

  private async load(): Promise<void> {
    this.isLoading.set(true);
    const events = await this.calendarAdapter.getEvents();
    this.events.set(events);
    this.lastUpdated.set(new Date());
    this.isLoading.set(false);
  }
}

function readView(): CalendarView {
  try {
    return globalThis.localStorage?.getItem(CALENDAR_VIEW_STORAGE_KEY) === 'list'
      ? 'list'
      : 'month';
  } catch {
    return 'month';
  }
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
