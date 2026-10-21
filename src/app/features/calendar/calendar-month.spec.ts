import { CalendarEvent } from '../../core/models/calendar.model';
import { buildMonth, eventDayKeys } from './calendar-month';

const event = (fields: Partial<CalendarEvent>): CalendarEvent => ({
  id: 'event',
  title: 'Event',
  startsAt: '2026-10-21T09:00:00.000Z',
  source: 'ics',
  ...fields,
});

const localIso = (y: number, m: number, d: number, h = 0, min = 0) =>
  new Date(y, m - 1, d, h, min).toISOString();

describe('calendar month', () => {
  it('should place all-day events on every covered date, end exclusive', () => {
    expect(
      eventDayKeys(
        event({
          allDay: true,
          startsAt: '2026-10-26T00:00:00.000Z',
          endsAt: '2026-10-29T00:00:00.000Z',
        }),
      ),
    ).toEqual(['2026-10-26', '2026-10-27', '2026-10-28']);
    expect(eventDayKeys(event({ allDay: true, startsAt: '2026-10-26T00:00:00.000Z' }))).toEqual([
      '2026-10-26',
    ]);
  });

  it('should place timed events on their local days', () => {
    expect(
      eventDayKeys(
        event({ startsAt: localIso(2026, 10, 21, 0, 30), endsAt: localIso(2026, 10, 21, 1) }),
      ),
    ).toEqual(['2026-10-21']);
    expect(
      eventDayKeys(
        event({ startsAt: localIso(2026, 10, 21, 22), endsAt: localIso(2026, 10, 23, 0) }),
      ),
    ).toEqual(['2026-10-21', '2026-10-22']);
  });

  it('should build full Monday-first weeks with sorted events', () => {
    const days = buildMonth(
      new Date(2026, 9, 1),
      [
        event({ id: 'late', startsAt: localIso(2026, 10, 21, 15) }),
        event({ id: 'early', startsAt: localIso(2026, 10, 21, 8) }),
        event({ id: 'all-day', allDay: true, startsAt: '2026-10-21T00:00:00.000Z' }),
      ],
      new Date(2026, 9, 21, 12),
    );

    // October 2026 starts on a Thursday and ends on a Saturday
    expect(days[0]?.key).toBe('2026-09-28');
    expect(days.at(-1)?.key).toBe('2026-11-01');
    expect(days.length % 7).toBe(0);
    expect(days.filter((day) => day.inMonth)).toHaveLength(31);

    const today = days.find((day) => day.isToday);
    expect(today?.key).toBe('2026-10-21');
    expect(today?.events.map((item) => item.id)).toEqual(['all-day', 'early', 'late']);
  });
});
