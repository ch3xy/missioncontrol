import { Injectable, inject, signal } from '@angular/core';
import { IntegrationStatus, MOCK_STATUS } from '../models/integration-status.model';
import { DashAdapter, DashSummary } from '../models/dash.model';
import { MOCK_DASH_SUMMARY } from '../mock-data/dash.mock';
import { isRecord, readLocalJsonResult } from './local-json-source';
import { readDashApiSummary } from './dash-api';
import { SettingsService } from './settings.service';

@Injectable({ providedIn: 'root' })
export class DashAdapterService implements DashAdapter {
  private readonly settingsService = inject(SettingsService);
  private readonly statusState = signal<IntegrationStatus>(MOCK_STATUS);

  readonly status = this.statusState.asReadonly();

  /** Priority: dash REST API → local JSON → mock data. */
  async getSummary(): Promise<DashSummary> {
    const { dashApiUrl, dailyTargetHours } = this.settingsService.settings();

    if (dashApiUrl?.trim()) {
      return this.readApi(dashApiUrl, Math.round(dailyTargetHours * 60));
    }

    const url = this.settingsService.settings().dashSourceUrl;

    if (!url?.trim()) {
      this.statusState.set(MOCK_STATUS);
      return { ...MOCK_DASH_SUMMARY };
    }

    const result = await readLocalJsonResult(url, isDashSummary);

    if (result.data) {
      this.statusState.set({
        kind: 'local-json',
        message: 'status.dash.loaded',
        requestedUrl: url,
      });
      return { ...result.data };
    }

    this.statusState.set({
      kind: 'fallback',
      message: result.error === 'invalid-shape' ? 'status.dash.invalidShape' : 'status.dash.failed',
      requestedUrl: url,
    });
    return { ...MOCK_DASH_SUMMARY };
  }

  private async readApi(apiUrl: string, targetTodayMinutes: number): Promise<DashSummary> {
    const result = await readDashApiSummary(apiUrl, targetTodayMinutes);

    if (result.data) {
      this.statusState.set({ kind: 'api', message: 'status.dash.apiLoaded', requestedUrl: apiUrl });
      return result.data;
    }

    this.statusState.set({
      kind: 'fallback',
      message:
        result.error === 'invalid-shape' ? 'status.dash.apiInvalidShape' : 'status.dash.apiFailed',
      requestedUrl: apiUrl,
    });
    return { ...MOCK_DASH_SUMMARY };
  }
}

function isDashSummary(value: unknown): value is DashSummary {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value['trackedTodayMinutes'] === 'number' &&
    typeof value['targetTodayMinutes'] === 'number' &&
    typeof value['activeCustomers'] === 'number' &&
    typeof value['openProjects'] === 'number' &&
    (value['source'] === 'mock' || value['source'] === 'local-json')
  );
}
