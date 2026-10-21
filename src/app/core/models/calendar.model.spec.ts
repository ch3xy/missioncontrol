import { CalendarEvent, isUpcoming } from './calendar.model';

const event = (fields: Partial<CalendarEvent>): CalendarEvent => ({
  id: 'event',
  title: 'Event',
  startsAt: '2026-10-21T09:00:00.000Z',
  source: 'ics',
  ...fields,
});

describe('isUpcoming', () => {
  const now = new Date(2026, 9, 21, 12);
  const local = (d: number, h: number) => new Date(2026, 9, d, h).toISOString();

  it('should keep timed events until they end', () => {
    expect(isUpcoming(event({ startsAt: local(20, 9), endsAt: local(20, 10) }), now)).toBe(false);
    expect(isUpcoming(event({ startsAt: local(21, 11), endsAt: local(21, 13) }), now)).toBe(true);
    expect(isUpcoming(event({ startsAt: local(21, 11) }), now)).toBe(false);
    expect(isUpcoming(event({ startsAt: local(21, 14) }), now)).toBe(true);
  });

  it('should keep all-day events until the end of their last day', () => {
    const allDay = (startsAt: string, endsAt?: string) => event({ allDay: true, startsAt, endsAt });

    expect(isUpcoming(allDay('2026-10-20T00:00:00.000Z', '2026-10-21T00:00:00.000Z'), now)).toBe(
      false,
    );
    expect(isUpcoming(allDay('2026-10-21T00:00:00.000Z', '2026-10-22T00:00:00.000Z'), now)).toBe(
      true,
    );
    expect(isUpcoming(allDay('2026-10-19T00:00:00.000Z', '2026-10-24T00:00:00.000Z'), now)).toBe(
      true,
    );
    expect(isUpcoming(allDay('2026-10-20T00:00:00.000Z'), now)).toBe(false);
    expect(isUpcoming(allDay('2026-10-21T00:00:00.000Z'), now)).toBe(true);
  });
});
