export interface DashSummary {
  trackedTodayMinutes: number;
  targetTodayMinutes: number;
  activeCustomers: number;
  openProjects: number;
  source: 'mock' | 'local-json';
}

export interface DashAdapter {
  getSummary(): Promise<DashSummary>;
}
