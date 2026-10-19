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
  source: 'mock' | 'local-json' | 'api';
}

export interface VeloAdapter {
  getSummary(): Promise<VeloSummary>;
}
