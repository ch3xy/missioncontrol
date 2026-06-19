import { Injectable, inject, signal } from '@angular/core';
import { IntegrationStatus, MOCK_STATUS } from '../models/integration-status.model';
import { CashFlowPoint, VeloAdapter, VeloSummary } from '../models/velo.model';
import { MOCK_VELO_SUMMARY } from '../mock-data/velo.mock';
import { isRecord, readLocalJsonResult } from './local-json-source';
import { SettingsService } from './settings.service';

@Injectable({ providedIn: 'root' })
export class VeloAdapterService implements VeloAdapter {
  private readonly settingsService = inject(SettingsService);
  private readonly statusState = signal<IntegrationStatus>(MOCK_STATUS);

  readonly status = this.statusState.asReadonly();

  async getSummary(): Promise<VeloSummary> {
    const url = this.settingsService.settings().veloSourceUrl;

    if (!url?.trim()) {
      this.statusState.set(MOCK_STATUS);
      return cloneVeloSummary(MOCK_VELO_SUMMARY);
    }

    const result = await readLocalJsonResult(url, isVeloSummary);

    if (result.data) {
      this.statusState.set({
        kind: 'local-json',
        label: 'Local JSON',
        message: 'Loaded Velo summary from the configured local JSON URL.',
        requestedUrl: url,
      });
      return cloneVeloSummary(result.data);
    }

    this.statusState.set({
      kind: 'fallback',
      label: 'Mock fallback',
      message:
        result.error === 'invalid-shape'
          ? 'Velo JSON did not match the expected shape; using mock data.'
          : 'Velo JSON could not be loaded; using mock data.',
      requestedUrl: url,
    });
    return cloneVeloSummary(MOCK_VELO_SUMMARY);
  }
}

function cloneVeloSummary(summary: VeloSummary): VeloSummary {
  return {
    ...summary,
    trend: [...summary.trend],
  };
}

function isVeloSummary(value: unknown): value is VeloSummary {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value['currentCashFlow'] === 'number' &&
    typeof value['forecastCashFlow'] === 'number' &&
    value['currency'] === 'EUR' &&
    typeof value['periodLabel'] === 'string' &&
    (value['source'] === 'mock' || value['source'] === 'local-json') &&
    Array.isArray(value['trend']) &&
    value['trend'].every(isCashFlowPoint)
  );
}

function isCashFlowPoint(value: unknown): value is CashFlowPoint {
  return isRecord(value) && typeof value['date'] === 'string' && typeof value['value'] === 'number';
}
