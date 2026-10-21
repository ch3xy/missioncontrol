import { TestBed } from '@angular/core/testing';
import { createMemoryStorage } from '../../testing/memory-storage';
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
    const status = TestBed.inject(CalendarAdapterService).status();

    expect(events).toHaveLength(1);
    expect(events[0]?.id).toBe('json-event');
    expect(status?.kind).toBe('local-json');
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

    expect(velo?.periodLabel).toBe('JSON forecast');
    expect(dash?.openProjects).toBe(3);
    expect(TestBed.inject(VeloAdapterService).status()?.kind).toBe('local-json');
    expect(TestBed.inject(DashAdapterService).status()?.kind).toBe('local-json');
  });

  it('should show no events and a warning when local JSON validation fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ invalid: true })),
    );
    TestBed.inject(SettingsService).updateSettings({
      ...DEFAULT_SETTINGS,
      calendarSource: 'local-json',
      calendarSourceUrl: 'http://localhost:4500/broken-calendar.json',
    });

    const events = await TestBed.inject(CalendarAdapterService).getEvents();
    const status = TestBed.inject(CalendarAdapterService).status();

    expect(events).toEqual([]);
    expect(status?.kind).toBe('error');
    expect(status?.message).toBe('status.calendar.jsonInvalidShape');
  });

  it('should load calendar events from a configured ICS source', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(`
BEGIN:VCALENDAR
BEGIN:VEVENT
UID:ics-event
SUMMARY:ICS Planning
DTSTART:20260619T090000Z
END:VEVENT
END:VCALENDAR
`),
      ),
    );
    TestBed.inject(SettingsService).updateSettings({
      ...DEFAULT_SETTINGS,
      calendarSource: 'ics',
      calendarSourceUrl: 'http://localhost:4500/calendar.ics',
    });

    const events = await TestBed.inject(CalendarAdapterService).getEvents();
    const status = TestBed.inject(CalendarAdapterService).status();

    expect(events).toHaveLength(1);
    expect(events[0]?.title).toBe('ICS Planning');
    expect(events[0]?.source).toBe('ics');
    expect(status?.kind).toBe('ics');
  });

  it('should merge several ICS sources and drop events shared between them', async () => {
    const calendar = (uid: string, start: string) => `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:${uid}
SUMMARY:${uid}
DTSTART:${start}
END:VEVENT
BEGIN:VEVENT
UID:shared
SUMMARY:Shared
DTSTART:20260619T120000Z
END:VEVENT
END:VCALENDAR`;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) =>
      String(input).includes('work')
        ? new Response(calendar('work', '20260619T090000Z'))
        : new Response(calendar('private', '20260618T090000Z')),
    );
    vi.stubGlobal('fetch', fetchMock);
    TestBed.inject(SettingsService).updateSettings({
      ...DEFAULT_SETTINGS,
      calendarSource: 'ics',
      calendarSourceUrl:
        '/missioncontrol/calendars/work.ics\n\n/missioncontrol/calendars/private.ics',
    });

    const events = await TestBed.inject(CalendarAdapterService).getEvents();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(events.map((event) => event.id)).toEqual(['private', 'work', 'shared']);
    expect(TestBed.inject(CalendarAdapterService).status()?.kind).toBe('ics');
  });

  it('should keep loaded calendars and warn when one ICS source fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) =>
        String(input).includes('missing')
          ? new Response('<!doctype html><html></html>')
          : new Response(
              'BEGIN:VCALENDAR\nBEGIN:VEVENT\nUID:ok\nDTSTART:20260619T090000Z\nEND:VEVENT\nEND:VCALENDAR',
            ),
      ),
    );
    TestBed.inject(SettingsService).updateSettings({
      ...DEFAULT_SETTINGS,
      calendarSource: 'ics',
      calendarSourceUrl: '/calendars/ok.ics\n/calendars/missing.ics',
    });

    const events = await TestBed.inject(CalendarAdapterService).getEvents();
    const status = TestBed.inject(CalendarAdapterService).status();

    expect(events.map((event) => event.id)).toEqual(['ok']);
    expect(status?.kind).toBe('error');
    expect(status?.message).toBe('status.calendar.partiallyLoaded');
    expect(status?.requestedUrl).toBe('/calendars/missing.ics');
  });

  it('should accept an ICS calendar without events', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('BEGIN:VCALENDAR\nEND:VCALENDAR')),
    );
    TestBed.inject(SettingsService).updateSettings({
      ...DEFAULT_SETTINGS,
      calendarSource: 'ics',
      calendarSourceUrl: '/calendars/empty.ics',
    });

    const events = await TestBed.inject(CalendarAdapterService).getEvents();

    expect(events).toEqual([]);
    expect(TestBed.inject(CalendarAdapterService).status()?.kind).toBe('ics');
  });

  it('should report unconfigured sources instead of showing data', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const events = await TestBed.inject(CalendarAdapterService).getEvents();
    const velo = await TestBed.inject(VeloAdapterService).getSummary();
    const dash = await TestBed.inject(DashAdapterService).getSummary();

    expect(events).toEqual([]);
    expect(velo).toBeNull();
    expect(dash).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(TestBed.inject(CalendarAdapterService).status()?.kind).toBe('unconfigured');
    expect(TestBed.inject(VeloAdapterService).status()?.message).toBe('status.velo.unconfigured');
    expect(TestBed.inject(DashAdapterService).status()?.message).toBe('status.dash.unconfigured');
  });
});
