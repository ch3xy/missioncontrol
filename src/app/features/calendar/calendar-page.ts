import { DatePipe, formatDate } from '@angular/common';
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  LucideCalendarDays,
  LucideCalendarRange,
  LucideChevronLeft,
  LucideChevronRight,
  LucideList,
  LucideRefreshCw,
} from '@lucide/angular';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { CalendarEvent, isUpcoming } from '../../core/models/calendar.model';
import { CalendarAdapterService } from '../../core/services/calendar-adapter.service';
import { IntegrationNotice } from '../../shared/components/integration-notice/integration-notice';
import { SourceBadge } from '../../shared/components/source-badge/source-badge';
import { WidgetCard } from '../../shared/components/widget-card/widget-card';
import { buildMonth, eventDayKeys } from './calendar-month';
import { buildWeek, startOfWeek } from './calendar-week';

export type CalendarView = 'week' | 'month' | 'list';
const CALENDAR_VIEWS: CalendarView[] = ['week', 'month', 'list'];

/** Arrow convention: `<product>-<preference>` (see docs/arrow-corporate-design.md, section 9). */
export const CALENDAR_VIEW_STORAGE_KEY = 'missioncontrol-calendar-view';

/** Events beyond this are summarized as "+N more" in a month cell. */
const MAX_EVENTS_PER_DAY = 3;
/** The week view opens scrolled to this hour; its height shows the working day up to 18:00. */
const WEEK_FIRST_HOUR = 6;

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
    LucideCalendarRange,
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
  /** Monday of the week shown in the week view. */
  protected readonly week = signal(startOfWeek(new Date()));
  protected readonly now = signal(new Date());
  protected readonly weekDays = computed(() => buildWeek(this.week(), this.events(), this.now()));
  protected readonly hasAllDayEvents = computed(() =>
    this.weekDays().some((day) => day.allDay.length > 0),
  );
  /** Labels of the hour lines; midnight stays empty at the top edge. */
  protected readonly hourLabels = Array.from({ length: 24 }, (_, hour) =>
    hour === 0 ? '' : `${String(hour).padStart(2, '0')}:00`,
  );
  protected readonly nowMinute = computed(
    () => this.now().getHours() * 60 + this.now().getMinutes(),
  );
  protected readonly title = computed(() => {
    const locale = this.i18n.locale();

    if (this.view() === 'week') {
      const end = new Date(this.week());
      end.setDate(end.getDate() + 6);
      return `${formatDate(this.week(), this.i18n.t('format.dayMonth'), locale)} – ${formatDate(end, this.i18n.t('format.date'), locale)}`;
    }

    return this.view() === 'month'
      ? formatDate(this.month(), this.i18n.t('format.month'), locale)
      : this.i18n.t('calendar.upcoming');
  });
  private readonly weekScroll = viewChild<ElementRef<HTMLElement>>('weekScroll');
  protected readonly eventGroups = computed<CalendarEventGroup[]>(() => {
    const groups = new Map<string, CalendarEvent[]>();

    for (const event of this.events().filter((item) => isUpcoming(item, this.now()))) {
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

    const timer = setInterval(() => this.now.set(new Date()), 60_000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));

    // Each time the week view appears, show the working day; earlier and later hours are a scroll away
    afterRenderEffect(() => {
      const element = this.weekScroll()?.nativeElement;
      if (element) {
        // A few pixels less keeps the 06:00 label readable
        element.scrollTop = (element.scrollHeight * WEEK_FIRST_HOUR) / 24 - 8;
      }
    });
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

  /** One week or month back (-1) or ahead (1), depending on the view. */
  protected move(offset: number): void {
    if (this.view() === 'week') {
      const week = this.week();
      this.week.set(new Date(week.getFullYear(), week.getMonth(), week.getDate() + offset * 7));
    } else {
      const month = this.month();
      this.month.set(new Date(month.getFullYear(), month.getMonth() + offset, 1));
    }
  }

  protected showToday(): void {
    this.week.set(startOfWeek(new Date()));
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
    const stored = globalThis.localStorage?.getItem(CALENDAR_VIEW_STORAGE_KEY);
    return CALENDAR_VIEWS.find((view) => view === stored) ?? 'week';
  } catch {
    return 'week';
  }
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
