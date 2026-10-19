import { Injectable, inject, signal } from '@angular/core';
import { I18nService } from '../i18n/i18n.service';
import { TranslationKey } from '../i18n/translations';
import { IntegrationStatus, MOCK_STATUS } from '../models/integration-status.model';
import { CashFlowPoint, VeloAdapter, VeloSummary } from '../models/velo.model';
import { MOCK_VELO_SUMMARY } from '../mock-data/velo.mock';
import { isRecord, readLocalJsonResult } from './local-json-source';
import { SettingsService } from './settings.service';
import { VELO_FORECAST_HORIZON_DAYS, VeloApiResult, readVeloApiSummary } from './velo-api';

@Injectable({ providedIn: 'root' })
export class VeloAdapterService implements VeloAdapter {
  private readonly settingsService = inject(SettingsService);
  private readonly i18n = inject(I18nService);
  private readonly statusState = signal<IntegrationStatus>(MOCK_STATUS);

  readonly status = this.statusState.asReadonly();

  /** Priority: velo REST API → local JSON → mock data. */
  async getSummary(): Promise<VeloSummary> {
    const apiUrl = this.settingsService.settings().veloApiUrl;

    if (apiUrl?.trim()) {
      return this.readApi(apiUrl);
    }

    const url = this.settingsService.settings().veloSourceUrl;

    if (!url?.trim()) {
      this.statusState.set(MOCK_STATUS);
      return cloneVeloSummary(MOCK_VELO_SUMMARY);
    }

    const result = await readLocalJsonResult(url, isVeloSummary);

    if (result.data) {
      this.statusState.set({
        kind: 'local-json',
        message: 'status.velo.loaded',
        requestedUrl: url,
      });
      return cloneVeloSummary(result.data);
    }

    this.statusState.set({
      kind: 'fallback',
      message: result.error === 'invalid-shape' ? 'status.velo.invalidShape' : 'status.velo.failed',
      requestedUrl: url,
    });
    return cloneVeloSummary(MOCK_VELO_SUMMARY);
  }

  private async readApi(apiUrl: string): Promise<VeloSummary> {
    const periodLabel = this.i18n.t('velo.nextDays', { days: VELO_FORECAST_HORIZON_DAYS });
    const result = await readVeloApiSummary(apiUrl, periodLabel);

    if (result.data) {
      this.statusState.set({ kind: 'api', message: 'status.velo.apiLoaded', requestedUrl: apiUrl });
      return result.data;
    }

    this.statusState.set({
      kind: 'fallback',
      message: VELO_API_ERROR_MESSAGES[result.error ?? 'network'],
      requestedUrl: apiUrl,
    });
    return cloneVeloSummary(MOCK_VELO_SUMMARY);
  }
}

const VELO_API_ERROR_MESSAGES: Record<NonNullable<VeloApiResult['error']>, TranslationKey> = {
  'empty-url': 'status.velo.apiFailed',
  network: 'status.velo.apiFailed',
  http: 'status.velo.apiFailed',
  'invalid-shape': 'status.velo.apiInvalidShape',
  'no-accounts': 'status.velo.apiNoAccounts',
};

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
