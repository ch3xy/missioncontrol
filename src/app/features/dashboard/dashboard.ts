import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CalendarEvent } from '../../core/models/calendar.model';
import { DashSummary } from '../../core/models/dash.model';
import { AppShortcut } from '../../core/models/shortcut.model';
import { VeloSummary } from '../../core/models/velo.model';
import { CalendarAdapterService } from '../../core/services/calendar-adapter.service';
import { DashAdapterService } from '../../core/services/dash-adapter.service';
import { ShortcutService } from '../../core/services/shortcut.service';
import { VeloAdapterService } from '../../core/services/velo-adapter.service';
import { QuickAccessTile } from '../../shared/components/quick-access-tile/quick-access-tile';
import { TrendLine } from '../../shared/components/trend-line/trend-line';
import { WidgetCard } from '../../shared/components/widget-card/widget-card';

@Component({
  selector: 'app-dashboard',
  imports: [
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    RouterLink,
    QuickAccessTile,
    TrendLine,
    WidgetCard,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly calendarAdapter = inject(CalendarAdapterService);
  private readonly veloAdapter = inject(VeloAdapterService);
  private readonly dashAdapter = inject(DashAdapterService);
  private readonly shortcutService = inject(ShortcutService);

  protected readonly events = signal<CalendarEvent[]>([]);
  protected readonly velo = signal<VeloSummary | null>(null);
  protected readonly dash = signal<DashSummary | null>(null);
  protected readonly launchError = signal<string | null>(null);
  protected readonly shortcuts = this.shortcutService.shortcuts;
  protected readonly nextEvents = computed(() => this.events().slice(0, 3));
  protected readonly dashProgress = computed(() => {
    const summary = this.dash();

    if (!summary) {
      return 0;
    }

    return Math.min(
      100,
      Math.round(
        (summary.trackedTodayMinutes / summary.targetTodayMinutes) * 100,
      ),
    );
  });

  constructor() {
    void this.load();
  }

  protected launch(shortcut: AppShortcut): void {
    const didOpen = this.shortcutService.openExternal(shortcut.url);
    this.launchError.set(
      didOpen ? null : `${shortcut.label} has no valid http(s) URL configured.`,
    );
  }

  private async load(): Promise<void> {
    const [events, velo, dash] = await Promise.all([
      this.calendarAdapter.getEvents(),
      this.veloAdapter.getSummary(),
      this.dashAdapter.getSummary(),
    ]);

    this.events.set(events);
    this.velo.set(velo);
    this.dash.set(dash);
  }
}
