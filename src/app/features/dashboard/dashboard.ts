import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideRefreshCw, LucideSettings } from '@lucide/angular';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { CalendarEvent, isUpcoming } from '../../core/models/calendar.model';
import { DashSummary } from '../../core/models/dash.model';
import { AppShortcut } from '../../core/models/shortcut.model';
import { VeloSummary } from '../../core/models/velo.model';
import { CalendarAdapterService } from '../../core/services/calendar-adapter.service';
import { DashAdapterService } from '../../core/services/dash-adapter.service';
import { SettingsService } from '../../core/services/settings.service';
import { ShortcutService } from '../../core/services/shortcut.service';
import { VeloAdapterService } from '../../core/services/velo-adapter.service';
import { IntegrationNotice } from '../../shared/components/integration-notice/integration-notice';
import { QuickAccessTile } from '../../shared/components/quick-access-tile/quick-access-tile';
import { SourceBadge } from '../../shared/components/source-badge/source-badge';
import { TrendLine } from '../../shared/components/trend-line/trend-line';
import { WidgetCard } from '../../shared/components/widget-card/widget-card';
import { eventDayKeys, localDateKey } from '../calendar/calendar-month';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    IntegrationNotice,
    RouterLink,
    QuickAccessTile,
    SourceBadge,
    TrendLine,
    WidgetCard,
    LucideRefreshCw,
    LucideSettings,
    TranslatePipe,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  protected readonly i18n = inject(I18nService);
  private readonly calendarAdapter = inject(CalendarAdapterService);
  private readonly veloAdapter = inject(VeloAdapterService);
  private readonly dashAdapter = inject(DashAdapterService);
  private readonly shortcutService = inject(ShortcutService);
  private readonly settingsService = inject(SettingsService);
  private readonly document = inject(DOCUMENT);

  protected readonly events = signal<CalendarEvent[]>([]);
  protected readonly velo = signal<VeloSummary | null>(null);
  protected readonly dash = signal<DashSummary | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly lastUpdated = signal<Date | null>(null);
  /** Label of the shortcut that could not be opened. */
  protected readonly launchError = signal<string | null>(null);
  protected readonly calendarStatus = this.calendarAdapter.status;
  protected readonly veloStatus = this.veloAdapter.status;
  protected readonly dashStatus = this.dashAdapter.status;
  protected readonly shortcuts = this.shortcutService.shortcuts;
  protected readonly autoRefreshMinutes = computed(
    () => this.settingsService.settings().autoRefreshMinutes,
  );
  /** Today's appointments (local day) that are not over yet. */
  protected readonly todayEvents = computed(() => {
    const now = new Date();
    const todayKey = localDateKey(now);

    return this.events()
      .filter((event) => isUpcoming(event, now) && eventDayKeys(event).includes(todayKey))
      .slice(0, 3);
  });
  protected readonly hasCalendar = computed(
    () => this.calendarStatus()?.kind === 'ics' || this.calendarStatus()?.kind === 'local-json',
  );
  protected readonly calendarSource = computed(() => this.events()[0]?.source ?? null);
  /** Share of today's target; goes past 100 % for overtime (16 h of 8 h = 200 %). */
  protected readonly dashProgress = computed(() => {
    const summary = this.dash();

    if (!summary) {
      return 0;
    }

    return Math.round((summary.trackedTodayMinutes / summary.targetTodayMinutes) * 100);
  });
  /** The bar is full at the target. */
  protected readonly dashProgressBar = computed(() => Math.min(100, this.dashProgress()));

  constructor() {
    void this.load();
    effect((onCleanup) => {
      const minutes = this.autoRefreshMinutes();

      if (minutes > 0) {
        onCleanup(this.startAutoRefresh(minutes * 60_000));
      }
    });
  }

  protected refresh(): void {
    void this.load();
  }

  protected launch(shortcut: AppShortcut): void {
    const didOpen = this.shortcutService.openExternal(shortcut.url);
    this.launchError.set(didOpen ? null : shortcut.label);
  }

  /**
   * Reloads every `intervalMs` while the tab is visible. A hidden tab skips its ticks and catches
   * up as soon as it becomes visible again, so no requests run for a dashboard nobody looks at.
   */
  private startAutoRefresh(intervalMs: number): () => void {
    const refreshIfVisible = () => {
      if (!this.document.hidden) {
        void this.load();
      }
    };
    const refreshIfStale = () => {
      const updated = this.lastUpdated();

      if (!updated || Date.now() - updated.getTime() >= intervalMs) {
        refreshIfVisible();
      }
    };
    const timer = setInterval(refreshIfVisible, intervalMs);
    this.document.addEventListener('visibilitychange', refreshIfStale);

    return () => {
      clearInterval(timer);
      this.document.removeEventListener('visibilitychange', refreshIfStale);
    };
  }

  private async load(): Promise<void> {
    if (this.isLoading()) {
      return;
    }

    this.isLoading.set(true);

    const [events, velo, dash] = await Promise.all([
      this.calendarAdapter.getEvents(),
      this.veloAdapter.getSummary(),
      this.dashAdapter.getSummary(),
    ]);

    this.events.set(events);
    this.velo.set(velo);
    this.dash.set(dash);
    this.lastUpdated.set(new Date());
    this.isLoading.set(false);
  }
}
