import { DashSummary } from '../models/dash.model';
import { isFiniteNumber, readApiResult } from './api-source';
import { LocalJsonResult, isRecord } from './local-json-source';

/** Subset of dash's `DashboardResponse`. */
interface DashDashboard {
  today: { durationSeconds: number };
}

/**
 * Reads dash's REST API: today's tracked time from `/api/v1/dashboard`, the active (non-archived)
 * clients and the active projects. dash has no daily target, so it comes from mission control's settings.
 */
export async function readDashApiSummary(
  baseUrl: string,
  targetTodayMinutes: number,
): Promise<LocalJsonResult<DashSummary>> {
  const [dashboard, clients, projects] = await Promise.all([
    readApiResult(baseUrl, 'api/v1/dashboard', isDashboard),
    readApiResult(baseUrl, 'api/v1/clients', isRecordList),
    readApiResult(baseUrl, 'api/v1/projects?status=ACTIVE', isRecordList),
  ]);

  if (!dashboard.data || !clients.data || !projects.data) {
    return { data: null, error: dashboard.error ?? clients.error ?? projects.error };
  }

  return {
    data: {
      trackedTodayMinutes: Math.round(dashboard.data.today.durationSeconds / 60),
      targetTodayMinutes,
      activeCustomers: clients.data.filter((client) => client['archived'] !== true).length,
      openProjects: projects.data.length,
      source: 'api',
    },
  };
}

function isDashboard(value: unknown): value is DashDashboard {
  return (
    isRecord(value) && isRecord(value['today']) && isFiniteNumber(value['today']['durationSeconds'])
  );
}

function isRecordList(value: unknown): value is Record<string, unknown>[] {
  return Array.isArray(value) && value.every(isRecord);
}
