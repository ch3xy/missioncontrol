import { Injectable, inject } from '@angular/core';
import { CashFlowPoint, VeloAdapter, VeloSummary } from '../models/velo.model';
import { MOCK_VELO_SUMMARY } from '../mock-data/velo.mock';
import { isRecord, readLocalJson } from './local-json-source';
import { SettingsService } from './settings.service';

@Injectable({ providedIn: 'root' })
export class VeloAdapterService implements VeloAdapter {
  private readonly settingsService = inject(SettingsService);

  async getSummary(): Promise<VeloSummary> {
    const localSummary = await readLocalJson(
      this.settingsService.settings().veloSourceUrl,
      isVeloSummary,
    );

    return cloneVeloSummary(localSummary ?? MOCK_VELO_SUMMARY);
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
  return (
    isRecord(value) &&
    typeof value['date'] === 'string' &&
    typeof value['value'] === 'number'
  );
}
