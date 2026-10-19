import { CashFlowPoint, VeloSummary } from '../models/velo.model';
import { ApiError, isFiniteNumber, readApiResult } from './api-source';
import { isRecord } from './local-json-source';

export const VELO_FORECAST_HORIZON_DAYS = 30;

/** Subset of velo's `AccountTO`. */
interface VeloAccount {
  id: string;
  currency: string;
  currentBalance: number;
}

/** Subset of velo's `ForecastResultTO`. */
interface VeloForecast {
  dailyBalances: { date: string; balance: number }[];
}

export interface VeloApiResult {
  data: VeloSummary | null;
  error?: ApiError | 'no-accounts';
}

/**
 * Reads velo's REST API (`/api/accounts`, `/api/accounts/{id}/forecast`) and sums all EUR accounts:
 * current balances and the day-by-day forecast balances.
 */
export async function readVeloApiSummary(
  baseUrl: string,
  periodLabel: string,
): Promise<VeloApiResult> {
  const accounts = await readApiResult(baseUrl, 'api/accounts', isAccountList);

  if (!accounts.data) {
    return { data: null, error: accounts.error };
  }

  const eurAccounts = accounts.data.filter((account) => account.currency === 'EUR');

  if (eurAccounts.length === 0) {
    return { data: null, error: 'no-accounts' };
  }

  const forecasts = await Promise.all(
    eurAccounts.map((account) =>
      readApiResult(
        baseUrl,
        `api/accounts/${encodeURIComponent(account.id)}/forecast?horizon=${VELO_FORECAST_HORIZON_DAYS}`,
        isForecast,
      ),
    ),
  );
  const failed = forecasts.find((forecast) => !forecast.data);

  if (failed) {
    return { data: null, error: failed.error };
  }

  const totals = new Map<string, number>();

  for (const forecast of forecasts) {
    for (const day of forecast.data?.dailyBalances ?? []) {
      totals.set(day.date, (totals.get(day.date) ?? 0) + day.balance);
    }
  }

  const trend: CashFlowPoint[] = [...totals]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value: roundCents(value) }));
  const currentCashFlow = roundCents(
    eurAccounts.reduce((sum, account) => sum + account.currentBalance, 0),
  );

  return {
    data: {
      currentCashFlow,
      forecastCashFlow: trend.at(-1)?.value ?? currentCashFlow,
      currency: 'EUR',
      periodLabel,
      trend,
      source: 'api',
    },
  };
}

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

function isAccountList(value: unknown): value is VeloAccount[] {
  return (
    Array.isArray(value) &&
    value.every(
      (account) =>
        isRecord(account) &&
        typeof account['id'] === 'string' &&
        typeof account['currency'] === 'string' &&
        isFiniteNumber(account['currentBalance']),
    )
  );
}

function isForecast(value: unknown): value is VeloForecast {
  return (
    isRecord(value) &&
    Array.isArray(value['dailyBalances']) &&
    value['dailyBalances'].every(
      (day) => isRecord(day) && typeof day['date'] === 'string' && isFiniteNumber(day['balance']),
    )
  );
}
