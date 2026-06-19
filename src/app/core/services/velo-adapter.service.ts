import { Injectable } from '@angular/core';
import { VeloAdapter, VeloSummary } from '../models/velo.model';
import { MOCK_VELO_SUMMARY } from '../mock-data/velo.mock';

@Injectable({ providedIn: 'root' })
export class VeloAdapterService implements VeloAdapter {
  async getSummary(): Promise<VeloSummary> {
    return {
      ...MOCK_VELO_SUMMARY,
      trend: [...MOCK_VELO_SUMMARY.trend],
    };
  }
}
