import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { VeloSummary } from '../../core/models/velo.model';
import { ShortcutService } from '../../core/services/shortcut.service';
import { VeloAdapterService } from '../../core/services/velo-adapter.service';
import { SourceBadge } from '../../shared/components/source-badge/source-badge';
import { TrendLine } from '../../shared/components/trend-line/trend-line';
import { WidgetCard } from '../../shared/components/widget-card/widget-card';

@Component({
  selector: 'app-velo-page',
  imports: [CurrencyPipe, SourceBadge, TrendLine, WidgetCard],
  templateUrl: './velo-page.html',
  styleUrl: './velo-page.css',
})
export class VeloPage {
  private readonly veloAdapter = inject(VeloAdapterService);
  private readonly shortcutService = inject(ShortcutService);

  protected readonly summary = signal<VeloSummary | null>(null);
  protected readonly launchError = signal<string | null>(null);

  constructor() {
    void this.veloAdapter.getSummary().then((summary) => this.summary.set(summary));
  }

  protected openVelo(): void {
    const shortcut = this.shortcutService
      .shortcuts()
      .find((candidate) => candidate.id === 'velo');
    const didOpen = this.shortcutService.openExternal(shortcut?.url);
    this.launchError.set(didOpen ? null : 'Velo has no valid http(s) URL configured.');
  }
}
