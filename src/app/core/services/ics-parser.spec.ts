import { IcsWindow, parseIcsEvents } from './ics-parser';

const VIENNA = `BEGIN:VTIMEZONE
TZID:Europe/Vienna
BEGIN:DAYLIGHT
TZOFFSETFROM:+0100
TZOFFSETTO:+0200
DTSTART:19810329T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
TZNAME:CEST
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:+0200
TZOFFSETTO:+0100
DTSTART:19961027T030000
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
TZNAME:CET
END:STANDARD
END:VTIMEZONE`;

const window = (from: string, to: string): IcsWindow => ({
  from: new Date(from),
  to: new Date(to),
});

describe('parseIcsEvents', () => {
  it('should parse VEVENT entries into calendar events', () => {
    const events = parseIcsEvents(`
BEGIN:VCALENDAR
BEGIN:VEVENT
UID:event-1
SUMMARY:Client Sync
DTSTART:20260619T130000Z
DTEND:20260619T134500Z
LOCATION:Meet
DESCRIPTION:Helio Systems
END:VEVENT
END:VCALENDAR
`);

    expect(events).toEqual([
      {
        id: 'event-1',
        title: 'Client Sync',
        startsAt: '2026-06-19T13:00:00.000Z',
        endsAt: '2026-06-19T13:45:00.000Z',
        location: 'Meet',
        project: 'Helio Systems',
        source: 'ics',
      },
    ]);
  });

  it('should attach calendar name and color to every event', () => {
    const calendar = (props: string) =>
      parseIcsEvents(`BEGIN:VCALENDAR
${props}
BEGIN:VEVENT
UID:event-1
DTSTART:20260619T130000Z
END:VEVENT
END:VCALENDAR`)[0];

    expect(calendar('X-WR-CALNAME:Arbeit\nX-APPLE-CALENDAR-COLOR:#FF2968FF')).toMatchObject({
      calendar: 'Arbeit',
      color: '#ff2968',
    });
    expect(calendar('NAME:Privat\nCOLOR:turquoise')).toMatchObject({
      calendar: 'Privat',
      color: 'turquoise',
    });
    expect(calendar('X-APPLE-CALENDAR-COLOR:red;background:url(x)')).toMatchObject({
      calendar: undefined,
      color: undefined,
    });
  });

  it('should ignore events without a valid start date', () => {
    const events = parseIcsEvents(`
BEGIN:VCALENDAR
BEGIN:VEVENT
UID:event-2
SUMMARY:Broken
END:VEVENT
END:VCALENDAR
`);

    expect(events).toEqual([]);
  });

  it('should expand weekly events in their time zone, skipping EXDATE and applying moved occurrences', () => {
    const events = parseIcsEvents(
      `BEGIN:VCALENDAR
${VIENNA}
BEGIN:VEVENT
UID:weekly
SUMMARY:Jour fixe
DTSTART;TZID=Europe/Vienna:20261019T090000
DTEND;TZID=Europe/Vienna:20261019T093000
RRULE:FREQ=WEEKLY;BYDAY=MO;COUNT=4
EXDATE;TZID=Europe/Vienna:20261102T090000
END:VEVENT
BEGIN:VEVENT
UID:weekly
RECURRENCE-ID;TZID=Europe/Vienna:20261109T090000
SUMMARY:Jour fixe (moved)
DTSTART;TZID=Europe/Vienna:20261109T100000
DTEND;TZID=Europe/Vienna:20261109T103000
END:VEVENT
END:VCALENDAR`,
      window('2026-10-20T00:00:00Z', '2027-10-20T00:00:00Z'),
    );

    // 26 Oct is after the switch to CET, so 09:00 local is 08:00 UTC instead of 07:00.
    expect(events.map(({ title, startsAt, endsAt }) => ({ title, startsAt, endsAt }))).toEqual([
      {
        title: 'Jour fixe',
        startsAt: '2026-10-26T08:00:00.000Z',
        endsAt: '2026-10-26T08:30:00.000Z',
      },
      {
        title: 'Jour fixe (moved)',
        startsAt: '2026-11-09T09:00:00.000Z',
        endsAt: '2026-11-09T09:30:00.000Z',
      },
    ]);
    expect(events.every((event) => event.id === 'weekly')).toBe(true);
  });

  it('should only generate occurrences of endless rules inside the window', () => {
    const events = parseIcsEvents(
      `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:daily
SUMMARY:Standup
DTSTART:20200101T090000Z
DTEND:20200101T091500Z
RRULE:FREQ=DAILY
END:VEVENT
END:VCALENDAR`,
      window('2026-10-20T00:00:00Z', '2026-10-23T23:59:59Z'),
    );

    expect(events.map((event) => event.startsAt)).toEqual([
      '2026-10-20T09:00:00.000Z',
      '2026-10-21T09:00:00.000Z',
      '2026-10-22T09:00:00.000Z',
      '2026-10-23T09:00:00.000Z',
    ]);
  });

  it('should expand monthly weekday rules and all-day events', () => {
    const events = parseIcsEvents(
      `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:monthly
SUMMARY:Steuer
DTSTART;VALUE=DATE:20261013
DTEND;VALUE=DATE:20261014
RRULE:FREQ=MONTHLY;BYDAY=2TU;COUNT=3
END:VEVENT
END:VCALENDAR`,
      window('2026-10-01T00:00:00Z', '2027-10-01T00:00:00Z'),
    );

    expect(events.map((event) => event.startsAt)).toEqual([
      '2026-10-13T00:00:00.000Z',
      '2026-11-10T00:00:00.000Z',
      '2026-12-08T00:00:00.000Z',
    ]);
  });

  it('should keep a moved occurrence whose series is not in the file', () => {
    const events = parseIcsEvents(`BEGIN:VCALENDAR
BEGIN:VEVENT
UID:orphan
RECURRENCE-ID:20261109T090000Z
SUMMARY:Moved only
DTSTART:20261110T090000Z
END:VEVENT
END:VCALENDAR`);

    expect(events.map((event) => event.title)).toEqual(['Moved only']);
  });

  it('should throw on text that is not iCalendar', () => {
    expect(() => parseIcsEvents('<!doctype html><html></html>')).toThrow();
  });
});
