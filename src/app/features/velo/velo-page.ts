import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { LucideExternalLink, LucideRefreshCw } from '@lucide/angular';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { VeloSummary } from '../../core/models/velo.model';
import { ShortcutService } from '../../core/services/shortcut.service';
import { VeloAdapterService } from '../../core/services/velo-adapter.service';
import { IntegrationNotice } from '../../shared/components/integration-notice/integration-notice';
import { SOURCE_LABELS, SourceBadge } from '../../shared/components/source-badge/source-badge';
import { TrendLine } from '../../shared/components/trend-line/trend-line';
import { WidgetCard } from '../../shared/components/widget-card/widget-card';

@Component({
  selector: 'app-velo-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CurrencyPipe,
    DatePipe,
    IntegrationNotice,
    SourceBadge,
    TrendLine,
    WidgetCard,
    LucideExternalLink,
    LucideRefreshCw,
    TranslatePipe,
  ],
  templateUrl: './velo-page.html',
  styleUrl: './velo-page.scss',
})
export class VeloPage {
  protected readonly i18n = inject(I18nService);
  private readonly veloAdapter = inject(VeloAdapterService);
  private readonly shortcutService = inject(ShortcutService);

  protected readonly status = this.veloAdapter.status;
  protected readonly sourceLabels = SOURCE_LABELS;
  protected readonly summary = signal<VeloSummary | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly lastUpdated = signal<Date | null>(null);
  protected readonly launchError = signal<string | null>(null);

  constructor() {
    void this.load();
  }

  protected refresh(): void {
    void this.load();
  }

  protected openVelo(): void {
    const shortcut = this.shortcutService.shortcuts().find((candidate) => candidate.id === 'velo');
    const didOpen = this.shortcutService.openExternal(shortcut?.url);
    this.launchError.set(didOpen ? null : 'Velo');
  }

  private async load(): Promise<void> {
    this.isLoading.set(true);
    this.summary.set(await this.veloAdapter.getSummary());
    this.lastUpdated.set(new Date());
    this.isLoading.set(false);
  }
}
