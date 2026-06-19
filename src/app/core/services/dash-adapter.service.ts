import { Injectable, inject, signal } from '@angular/core';
import { IntegrationStatus, MOCK_STATUS } from '../models/integration-status.model';
import { DashAdapter, DashSummary } from '../models/dash.model';
import { MOCK_DASH_SUMMARY } from '../mock-data/dash.mock';
import { isRecord, readLocalJsonResult } from './local-json-source';
import { SettingsService } from './settings.service';

@Injectable({ providedIn: 'root' })
export class DashAdapterService implements DashAdapter {
  private readonly settingsService = inject(SettingsService);
  private readonly statusState = signal<IntegrationStatus>(MOCK_STATUS);

  readonly status = this.statusState.asReadonly();

  async getSummary(): Promise<DashSummary> {
    const url = this.settingsService.settings().dashSourceUrl;

    if (!url?.trim()) {
      this.statusState.set(MOCK_STATUS);
      return { ...MOCK_DASH_SUMMARY };
    }

    const result = await readLocalJsonResult(url, isDashSummary);

    if (result.data) {
      this.statusState.set({
        kind: 'local-json',
        label: 'Local JSON',
        message: 'Loaded Dash summary from the configured local JSON URL.',
        requestedUrl: url,
      });
      return { ...result.data };
    }

    this.statusState.set({
      kind: 'fallback',
      label: 'Mock fallback',
      message:
        result.error === 'invalid-shape'
          ? 'Dash JSON did not match the expected shape; using mock data.'
          : 'Dash JSON could not be loaded; using mock data.',
      requestedUrl: url,
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
