export interface DashSummary {
  trackedTodayMinutes: number;
  targetTodayMinutes: number;
  activeCustomers: number;
  openProjects: number;
  source: 'local-json' | 'api';
}

export interface DashAdapter {
  /** `null` when no source is configured or the source failed; see the adapter's status. */
  getSummary(): Promise<DashSummary | null>;
}
