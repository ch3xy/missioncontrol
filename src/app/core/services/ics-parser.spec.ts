import { parseIcsEvents } from './ics-parser';

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
});
