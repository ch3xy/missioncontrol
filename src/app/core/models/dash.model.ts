export interface DashSummary {
  trackedTodayMinutes: number;
  targetTodayMinutes: number;
  activeCustomers: number;
  openProjects: number;
  source: 'mock' | 'local-json' | 'api';
}

export interface DashAdapter {
  getSummary(): Promise<DashSummary>;
}
