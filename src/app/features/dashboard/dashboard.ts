import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
import { ShortcutService } from '../../core/services/shortcut.service';
import { VeloAdapterService } from '../../core/services/velo-adapter.service';
import { IntegrationNotice } from '../../shared/components/integration-notice/integration-notice';
import { QuickAccessTile } from '../../shared/components/quick-access-tile/quick-access-tile';
import { SourceBadge } from '../../shared/components/source-badge/source-badge';
import { TrendLine } from '../../shared/components/trend-line/trend-line';
import { WidgetCard } from '../../shared/components/widget-card/widget-card';

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
  protected readonly nextEvents = computed(() =>
    this.events()
      .filter((event) => isUpcoming(event))
      .slice(0, 3),
  );
  protected readonly calendarSource = computed(() => this.events()[0]?.source ?? null);
  protected readonly dashProgress = computed(() => {
    const summary = this.dash();

    if (!summary) {
      return 0;
    }

    return Math.min(
      100,
      Math.round((summary.trackedTodayMinutes / summary.targetTodayMinutes) * 100),
    );
  });

  constructor() {
    void this.load();
  }

  protected refresh(): void {
    void this.load();
  }

  protected launch(shortcut: AppShortcut): void {
    const didOpen = this.shortcutService.openExternal(shortcut.url);
    this.launchError.set(didOpen ? null : shortcut.label);
  }

  private async load(): Promise<void> {
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
