import { CalendarEvent } from '../../core/models/calendar.model';
import { Task } from '../../core/models/task.model';
import { busyMinutes, capacity, formatMinutes, share } from './capacity';

const day = new Date(2026, 10, 9, 12);
const local = (hour: number, minute = 0, date = 9) =>
  new Date(2026, 10, date, hour, minute).toISOString();
const event = (startsAt: string, endsAt?: string, allDay = false): CalendarEvent => ({
  id: startsAt,
  title: 'Termin',
  startsAt,
  endsAt,
  allDay,
  source: 'ics',
});
const task = (estimateMinutes: number | null, status: Task['status'] = 'OPEN'): Task => ({
  id: String(Math.random()),
  title: 'x',
  estimateMinutes,
  status,
  planDate: '2026-11-09',
  position: 0,
  doneAt: null,
  version: 0,
});

describe('busyMinutes', () => {
  it('should count overlapping appointments once', () => {
    expect(
      busyMinutes(
        [
          event(local(9), local(10)),
          event(local(9, 30), local(11)),
          event(local(14), local(14, 30)),
        ],
        day,
      ),
    ).toBe(150);
  });

  it('should ignore all-day events, events without end and other days', () => {
    expect(
      busyMinutes(
        [
          event('2026-11-09T00:00:00.000Z', '2026-11-10T00:00:00.000Z', true),
          event(local(9)),
          event(local(9, 0, 10), local(10, 0, 10)),
        ],
        day,
      ),
    ).toBe(0);
  });

  it('should cut appointments at the day boundaries', () => {
    expect(busyMinutes([event(local(23, 0, 8), local(1))], day)).toBe(60);
  });
});

describe('capacity', () => {
  it('should subtract appointments from the target and sum the estimates', () => {
    const result = capacity([task(60), task(30, 'DONE'), task(null)], 8, 120);

    expect(result).toEqual({
      targetMinutes: 480,
      busyMinutes: 120,
      availableMinutes: 360,
      plannedMinutes: 90,
      doneMinutes: 30,
      unestimated: 1,
      overbooked: false,
    });
  });

  it('should flag an overbooked day and never go below zero', () => {
    const result = capacity([task(120)], 1, 90);

    expect(result.availableMinutes).toBe(0);
    expect(result.overbooked).toBe(true);
  });
});

describe('formatMinutes', () => {
  it('should format minutes and hours', () => {
    expect(formatMinutes(45)).toBe('45 min');
    expect(formatMinutes(90)).toBe('1:30 h');
    expect(formatMinutes(480)).toBe('8:00 h');
  });
});

describe('share', () => {
  it('should round and cap at 100 %', () => {
    expect(share(45, 180)).toBe(25);
    expect(share(300, 180)).toBe(100);
  });

  it('should show a full bar for time without anything available and an empty one for nothing', () => {
    expect(share(30, 0)).toBe(100);
    expect(share(0, 0)).toBe(0);
  });
});
