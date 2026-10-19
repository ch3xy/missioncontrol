import { TestBed } from '@angular/core/testing';
import { createMemoryStorage } from '../../testing/memory-storage';
import { DEFAULT_SETTINGS } from '../models/settings.model';
import { DashAdapterService } from './dash-adapter.service';
import { SettingsService } from './settings.service';
import { VeloAdapterService } from './velo-adapter.service';

type Routes = Record<string, unknown>;

/** Answers each request with the payload of the first route the URL ends with; 404 otherwise. */
function stubApi(routes: Routes): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const match = Object.keys(routes).find((path) => url.endsWith(path));
    return match ? Response.json(routes[match]) : new Response('', { status: 404 });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

// Shapes follow velo's AccountTO / ForecastResultTO and dash's DashboardResponse / ClientResponse.
const VELO_ROUTES: Routes = {
  '/api/accounts': [
    { id: 'a1', name: 'Business', currentBalance: 1000.5, currency: 'EUR' },
    { id: 'a2', name: 'Tax', currentBalance: 500, currency: 'EUR' },
    { id: 'a3', name: 'USD', currentBalance: 9999, currency: 'USD' },
  ],
  '/api/accounts/a1/forecast?horizon=30': {
    currentBalance: 1000.5,
    dailyBalances: [
      { date: '2026-10-19', balance: 1000.5 },
      { date: '2026-10-20', balance: 1200 },
    ],
    events: [],
  },
  '/api/accounts/a2/forecast?horizon=30': {
    currentBalance: 500,
    dailyBalances: [
      { date: '2026-10-19', balance: 500 },
      { date: '2026-10-20', balance: 450 },
    ],
    events: [],
  },
};

const DASH_ROUTES: Routes = {
  '/api/v1/dashboard': {
    today: { durationSeconds: 9000, billableDurationSeconds: 7200, revenueAmount: 180 },
    period: { durationSeconds: 36000 },
    budgetAlerts: [],
  },
  '/api/v1/clients': [
    { id: 'c1', name: 'Northstar', archived: false },
    { id: 'c2', name: 'Helio', archived: false },
  ],
  '/api/v1/projects?status=ACTIVE': [
    { id: 'p1', status: 'ACTIVE' },
    { id: 'p2', status: 'ACTIVE' },
    { id: 'p3', status: 'ACTIVE' },
  ],
};

describe('REST API adapters', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function configure(settings: Partial<typeof DEFAULT_SETTINGS>): void {
    TestBed.inject(SettingsService).updateSettings({ ...DEFAULT_SETTINGS, ...settings });
  }

  it('should sum the EUR accounts and forecasts from the velo API', async () => {
    const fetchMock = stubApi(VELO_ROUTES);
    configure({ veloApiUrl: 'https://arrow.local/velo/' });
    const adapter = TestBed.inject(VeloAdapterService);

    const summary = await adapter.getSummary();

    expect(fetchMock).toHaveBeenCalledWith('https://arrow.local/velo/api/accounts');
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('/a3/'));
    expect(summary).toMatchObject({
      currentCashFlow: 1500.5,
      forecastCashFlow: 1650,
      periodLabel: 'Nächste 30 Tage',
      source: 'api',
    });
    expect(summary?.trend).toEqual([
      { date: '2026-10-19', value: 1500.5 },
      { date: '2026-10-20', value: 1650 },
    ]);
    expect(adapter.status()?.kind).toBe('api');
  });

  it('should prefer the API over a configured local JSON source', async () => {
    const fetchMock = stubApi(VELO_ROUTES);
    configure({
      veloApiUrl: 'https://arrow.local/velo',
      veloSourceUrl: 'http://localhost:4200/examples/velo.json',
    });

    await TestBed.inject(VeloAdapterService).getSummary();

    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringContaining('velo.json'));
  });

  it('should show no data and a warning when velo has no EUR account', async () => {
    stubApi({ '/api/accounts': [{ id: 'a3', currentBalance: 1, currency: 'USD' }] });
    configure({ veloApiUrl: 'https://arrow.local/velo' });
    const adapter = TestBed.inject(VeloAdapterService);

    const summary = await adapter.getSummary();

    expect(summary).toBeNull();
    expect(adapter.status()).toMatchObject({
      kind: 'error',
      message: 'status.velo.apiNoAccounts',
    });
  });

  it('should show no data and a warning when the velo API is unreachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );
    configure({ veloApiUrl: 'https://arrow.local/velo' });
    const adapter = TestBed.inject(VeloAdapterService);

    const summary = await adapter.getSummary();

    expect(summary).toBeNull();
    expect(adapter.status()).toMatchObject({ kind: 'error', message: 'status.velo.apiFailed' });
  });

  it('should read time, clients and projects from the dash API', async () => {
    stubApi(DASH_ROUTES);
    configure({ dashApiUrl: 'https://arrow.local/dash', dailyTargetHours: 7.5 });
    const adapter = TestBed.inject(DashAdapterService);

    const summary = await adapter.getSummary();

    expect(summary).toEqual({
      trackedTodayMinutes: 150,
      targetTodayMinutes: 450,
      activeCustomers: 2,
      openProjects: 3,
      source: 'api',
    });
    expect(adapter.status()?.kind).toBe('api');
  });

  it('should show no data and a warning when the dash API returns an unexpected shape', async () => {
    stubApi({ ...DASH_ROUTES, '/api/v1/dashboard': { today: null } });
    configure({ dashApiUrl: 'https://arrow.local/dash' });
    const adapter = TestBed.inject(DashAdapterService);

    const summary = await adapter.getSummary();

    expect(summary).toBeNull();
    expect(adapter.status()?.message).toBe('status.dash.apiInvalidShape');
  });
});
