import { Injectable } from '@angular/core';
import { DashAdapter, DashSummary } from '../models/dash.model';
import { MOCK_DASH_SUMMARY } from '../mock-data/dash.mock';

@Injectable({ providedIn: 'root' })
export class DashAdapterService implements DashAdapter {
  async getSummary(): Promise<DashSummary> {
    return { ...MOCK_DASH_SUMMARY };
  }
}
