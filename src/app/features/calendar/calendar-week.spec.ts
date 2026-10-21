import { CalendarEvent } from '../../core/models/calendar.model';
import { buildWeek, startOfWeek } from './calendar-week';

const event = (fields: Partial<CalendarEvent>): CalendarEvent => ({
  id: 'event',
  title: 'Event',
  startsAt: '2026-10-21T09:00:00.000Z',
  source: 'ics',
  ...fields,
});

const local = (d: number, h: number, min = 0) => new Date(2026, 9, d, h, min).toISOString();

describe('calendar week', () => {
  it('should start weeks on Monday', () => {
    expect(startOfWeek(new Date(2026, 9, 25, 18))).toEqual(new Date(2026, 9, 19));
    expect(startOfWeek(new Date(2026, 9, 19, 0, 30))).toEqual(new Date(2026, 9, 19));
  });

  it('should split all-day and timed events and mark today', () => {
    const week = buildWeek(
      new Date(2026, 9, 19),
      [
        event({ id: 'meeting', startsAt: local(21, 9), endsAt: local(21, 10, 30) }),
        event({
          id: 'holidays',
          allDay: true,
          startsAt: '2026-10-26T00:00:00.000Z',
          endsAt: '2026-10-31T00:00:00.000Z',
        }),
        event({ id: 'reminder', startsAt: local(22, 7) }),
      ],
      new Date(2026, 9, 21, 12),
    );

    expect(week.map((day) => day.key)).toEqual([
      '2026-10-19',
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
      '2026-10-23',
      '2026-10-24',
      '2026-10-25',
    ]);
    expect(week[2]?.isToday).toBe(true);
    expect(week[2]?.timed).toEqual([
      expect.objectContaining({ startMinute: 540, endMinute: 630, column: 0, columns: 1 }),
    ]);
    // Without an end it still gets a minimum height
    expect(week[3]?.timed[0]).toMatchObject({ startMinute: 420, endMinute: 450 });
    expect(week.every((day) => day.allDay.length === 0)).toBe(true);
  });

  it('should cut events spanning midnight into one segment per day', () => {
    const week = buildWeek(new Date(2026, 9, 19), [
      event({ startsAt: local(20, 22), endsAt: local(21, 2) }),
    ]);

    expect(week[1]?.timed[0]).toMatchObject({ startMinute: 1320, endMinute: 1440 });
    expect(week[2]?.timed[0]).toMatchObject({ startMinute: 0, endMinute: 120 });
    expect(week[3]?.timed).toEqual([]);
  });

  it('should place overlapping events side by side', () => {
    const [monday] = buildWeek(new Date(2026, 9, 19), [
      event({ id: 'a', startsAt: local(19, 9), endsAt: local(19, 11) }),
      event({ id: 'b', startsAt: local(19, 10), endsAt: local(19, 12) }),
      event({ id: 'c', startsAt: local(19, 11), endsAt: local(19, 12) }),
      event({ id: 'd', startsAt: local(19, 14), endsAt: local(19, 15) }),
    ]);

    expect(
      monday?.timed.map(({ event: item, column, columns }) => [item.id, column, columns]),
    ).toEqual([
      ['a', 0, 2],
      ['b', 1, 2],
      ['c', 0, 2],
      ['d', 0, 1],
    ]);
  });
});
