import { Injectable, inject, signal } from '@angular/core';
import { I18nService } from '../i18n/i18n.service';
import { TranslationKey } from '../i18n/translations';
import { IntegrationStatus } from '../models/integration-status.model';
import { CashFlowPoint, VeloAdapter, VeloSummary } from '../models/velo.model';
import { isRecord, readLocalJsonResult } from './local-json-source';
import { SettingsService } from './settings.service';
import { VELO_FORECAST_HORIZON_DAYS, VeloApiResult, readVeloApiSummary } from './velo-api';

@Injectable({ providedIn: 'root' })
export class VeloAdapterService implements VeloAdapter {
  private readonly settingsService = inject(SettingsService);
  private readonly i18n = inject(I18nService);
  private readonly statusState = signal<IntegrationStatus | null>(null);
  /** Only the latest request may set the status; an older one finishing late is outdated. */
  private latestRequest = 0;

  readonly status = this.statusState.asReadonly();

  /** Priority: velo REST API → local JSON. No data without a working source. */
  async getSummary(): Promise<VeloSummary | null> {
    const request = ++this.latestRequest;
    // The sources come from the settings, which the backend delivers after the first render
    await this.settingsService.whenLoaded();
    const apiUrl = this.settingsService.settings().veloApiUrl;

    if (apiUrl?.trim()) {
      return this.readApi(request, apiUrl);
    }

    const url = this.settingsService.settings().veloSourceUrl;

    if (!url?.trim()) {
      this.setStatus(request, { kind: 'unconfigured', message: 'status.velo.unconfigured' });
      return null;
    }

    const result = await readLocalJsonResult(url, isVeloSummary);

    if (result.data) {
      this.setStatus(request, {
        kind: 'local-json',
        message: 'status.velo.loaded',
        requestedUrl: url,
      });
      return cloneVeloSummary(result.data);
    }

    this.setStatus(request, {
      kind: 'error',
      message: result.error === 'invalid-shape' ? 'status.velo.invalidShape' : 'status.velo.failed',
      requestedUrl: url,
    });
    return null;
  }

  private async readApi(request: number, apiUrl: string): Promise<VeloSummary | null> {
    const periodLabel = this.i18n.t('velo.nextDays', { days: VELO_FORECAST_HORIZON_DAYS });
    const result = await readVeloApiSummary(apiUrl, periodLabel);

    if (result.data) {
      this.setStatus(request, {
        kind: 'api',
        message: 'status.velo.apiLoaded',
        requestedUrl: apiUrl,
      });
      return result.data;
    }

    this.setStatus(request, {
      kind: 'error',
      message: VELO_API_ERROR_MESSAGES[result.error ?? 'network'],
      requestedUrl: apiUrl,
    });
    return null;
  }

  private setStatus(request: number, status: IntegrationStatus): void {
    if (request === this.latestRequest) {
      this.statusState.set(status);
    }
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
    value['source'] === 'local-json' &&
    Array.isArray(value['trend']) &&
    value['trend'].every(isCashFlowPoint)
  );
}

function isCashFlowPoint(value: unknown): value is CashFlowPoint {
  return isRecord(value) && typeof value['date'] === 'string' && typeof value['value'] === 'number';
}
