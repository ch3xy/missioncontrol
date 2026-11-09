import { Injectable, inject, signal } from '@angular/core';
import { IntegrationStatus } from '../models/integration-status.model';
import { DashAdapter, DashSummary } from '../models/dash.model';
import { isRecord, readLocalJsonResult } from './local-json-source';
import { readDashApiSummary } from './dash-api';
import { SettingsService } from './settings.service';

@Injectable({ providedIn: 'root' })
export class DashAdapterService implements DashAdapter {
  private readonly settingsService = inject(SettingsService);
  private readonly statusState = signal<IntegrationStatus | null>(null);
  /** Only the latest request may set the status; an older one finishing late is outdated. */
  private latestRequest = 0;

  readonly status = this.statusState.asReadonly();

  /** Priority: dash REST API → local JSON. No data without a working source. */
  async getSummary(): Promise<DashSummary | null> {
    const request = ++this.latestRequest;
    // The sources come from the settings, which the backend delivers after the first render
    await this.settingsService.whenLoaded();
    const { dashApiUrl, dailyTargetHours } = this.settingsService.settings();

    if (dashApiUrl?.trim()) {
      return this.readApi(request, dashApiUrl, Math.round(dailyTargetHours * 60));
    }

    const url = this.settingsService.settings().dashSourceUrl;

    if (!url?.trim()) {
      this.setStatus(request, { kind: 'unconfigured', message: 'status.dash.unconfigured' });
      return null;
    }

    const result = await readLocalJsonResult(url, isDashSummary);

    if (result.data) {
      this.setStatus(request, {
        kind: 'local-json',
        message: 'status.dash.loaded',
        requestedUrl: url,
      });
      return { ...result.data };
    }

    this.setStatus(request, {
      kind: 'error',
      message: result.error === 'invalid-shape' ? 'status.dash.invalidShape' : 'status.dash.failed',
      requestedUrl: url,
    });
    return null;
  }

  private async readApi(
    request: number,
    apiUrl: string,
    targetTodayMinutes: number,
  ): Promise<DashSummary | null> {
    const result = await readDashApiSummary(apiUrl, targetTodayMinutes);

    if (result.data) {
      this.setStatus(request, {
        kind: 'api',
        message: 'status.dash.apiLoaded',
        requestedUrl: apiUrl,
      });
      return result.data;
    }

    this.setStatus(request, {
      kind: 'error',
      message:
        result.error === 'invalid-shape' ? 'status.dash.apiInvalidShape' : 'status.dash.apiFailed',
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

function isDashSummary(value: unknown): value is DashSummary {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value['trackedTodayMinutes'] === 'number' &&
    typeof value['targetTodayMinutes'] === 'number' &&
    value['targetTodayMinutes'] > 0 &&
    typeof value['activeCustomers'] === 'number' &&
    typeof value['openProjects'] === 'number' &&
    value['source'] === 'local-json'
  );
}
