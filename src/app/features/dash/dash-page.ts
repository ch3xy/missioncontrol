import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { LucideExternalLink, LucideRefreshCw } from '@lucide/angular';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { DashSummary } from '../../core/models/dash.model';
import { DashAdapterService } from '../../core/services/dash-adapter.service';
import { ShortcutService } from '../../core/services/shortcut.service';
import { IntegrationNotice } from '../../shared/components/integration-notice/integration-notice';
import { SourceBadge } from '../../shared/components/source-badge/source-badge';
import { WidgetCard } from '../../shared/components/widget-card/widget-card';

@Component({
  selector: 'app-dash-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    DecimalPipe,
    IntegrationNotice,
    SourceBadge,
    WidgetCard,
    LucideExternalLink,
    LucideRefreshCw,
    TranslatePipe,
  ],
  templateUrl: './dash-page.html',
  styleUrl: './dash-page.scss',
})
export class DashPage {
  protected readonly i18n = inject(I18nService);
  private readonly dashAdapter = inject(DashAdapterService);
  private readonly shortcutService = inject(ShortcutService);

  protected readonly status = this.dashAdapter.status;
  protected readonly summary = signal<DashSummary | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly lastUpdated = signal<Date | null>(null);
  protected readonly launchError = signal<string | null>(null);
  protected readonly progress = computed(() => {
    const summary = this.summary();

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

  protected openDash(): void {
    const shortcut = this.shortcutService.shortcuts().find((candidate) => candidate.id === 'dash');
    const didOpen = this.shortcutService.openExternal(shortcut?.url);
    this.launchError.set(didOpen ? null : 'Dash');
  }

  private async load(): Promise<void> {
    this.isLoading.set(true);
    this.summary.set(await this.dashAdapter.getSummary());
    this.lastUpdated.set(new Date());
    this.isLoading.set(false);
  }
}
