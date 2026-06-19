import { Injectable, inject } from '@angular/core';
import { DashAdapter, DashSummary } from '../models/dash.model';
import { MOCK_DASH_SUMMARY } from '../mock-data/dash.mock';
import { isRecord, readLocalJson } from './local-json-source';
import { SettingsService } from './settings.service';

@Injectable({ providedIn: 'root' })
export class DashAdapterService implements DashAdapter {
  private readonly settingsService = inject(SettingsService);

  async getSummary(): Promise<DashSummary> {
    const localSummary = await readLocalJson(
      this.settingsService.settings().dashSourceUrl,
      isDashSummary,
    );

    return { ...(localSummary ?? MOCK_DASH_SUMMARY) };
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
