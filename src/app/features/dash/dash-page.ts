import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { DashSummary } from '../../core/models/dash.model';
import { DashAdapterService } from '../../core/services/dash-adapter.service';
import { ShortcutService } from '../../core/services/shortcut.service';
import { WidgetCard } from '../../shared/components/widget-card/widget-card';

@Component({
  selector: 'app-dash-page',
  imports: [DecimalPipe, WidgetCard],
  templateUrl: './dash-page.html',
  styleUrl: './dash-page.css',
})
export class DashPage {
  private readonly dashAdapter = inject(DashAdapterService);
  private readonly shortcutService = inject(ShortcutService);

  protected readonly summary = signal<DashSummary | null>(null);
  protected readonly launchError = signal<string | null>(null);
  protected readonly progress = computed(() => {
    const summary = this.summary();

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
    void this.dashAdapter.getSummary().then((summary) => this.summary.set(summary));
  }

  protected openDash(): void {
    const shortcut = this.shortcutService
      .shortcuts()
      .find((candidate) => candidate.id === 'dash');
    const didOpen = this.shortcutService.openExternal(shortcut?.url);
    this.launchError.set(didOpen ? null : 'Dash has no valid http(s) URL configured.');
  }
}
