import { TestBed } from '@angular/core/testing';
import { createMemoryStorage } from '../../testing/memory-storage';
import { MOCK_CALENDAR_EVENTS } from '../mock-data/calendar.mock';
import { DEFAULT_SETTINGS } from '../models/settings.model';
import { CalendarAdapterService } from './calendar-adapter.service';
import { DashAdapterService } from './dash-adapter.service';
import { SettingsService } from './settings.service';
import { VeloAdapterService } from './velo-adapter.service';

describe('local JSON adapters', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should load calendar events from a configured local JSON source', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json([
          {
            id: 'json-event',
            title: 'JSON Planning',
            startsAt: '2026-06-19T08:00:00.000Z',
            source: 'local-json',
          },
        ]),
      ),
    );
    TestBed.inject(SettingsService).updateSettings({
      ...DEFAULT_SETTINGS,
      calendarSource: 'local-json',
      calendarSourceUrl: 'http://localhost:4500/calendar.json',
    });

    const events = await TestBed.inject(CalendarAdapterService).getEvents();

    expect(events).toHaveLength(1);
    expect(events[0]?.id).toBe('json-event');
  });

  it('should load Velo and Dash summaries from configured local JSON sources', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.includes('velo')) {
        return Response.json({
          currentCashFlow: 1000,
          forecastCashFlow: 1400,
          currency: 'EUR',
          periodLabel: 'JSON forecast',
          trend: [{ date: '2026-06-19', value: 1000 }],
          source: 'local-json',
        });
      }

      return Response.json({
        trackedTodayMinutes: 60,
        targetTodayMinutes: 480,
        activeCustomers: 2,
        openProjects: 3,
        source: 'local-json',
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    TestBed.inject(SettingsService).updateSettings({
      ...DEFAULT_SETTINGS,
      veloSourceUrl: 'http://localhost:4500/velo.json',
      dashSourceUrl: 'http://localhost:4500/dash.json',
    });

    const velo = await TestBed.inject(VeloAdapterService).getSummary();
    const dash = await TestBed.inject(DashAdapterService).getSummary();

    expect(velo.periodLabel).toBe('JSON forecast');
    expect(dash.openProjects).toBe(3);
  });

  it('should fall back to mock data when local JSON validation fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ invalid: true })));
    TestBed.inject(SettingsService).updateSettings({
      ...DEFAULT_SETTINGS,
      calendarSource: 'local-json',
      calendarSourceUrl: 'http://localhost:4500/broken-calendar.json',
    });

    const events = await TestBed.inject(CalendarAdapterService).getEvents();

    expect(events).toHaveLength(MOCK_CALENDAR_EVENTS.length);
    expect(events[0]?.source).toBe('mock');
  });
});
