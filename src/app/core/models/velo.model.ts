export interface CashFlowPoint {
  date: string;
  value: number;
}

export interface VeloSummary {
  currentCashFlow: number;
  forecastCashFlow: number;
  currency: 'EUR';
  periodLabel: string;
  trend: CashFlowPoint[];
  source: 'local-json' | 'api';
}

export interface VeloAdapter {
  /** `null` when no source is configured or the source failed; see the adapter's status. */
  getSummary(): Promise<VeloSummary | null>;
}
