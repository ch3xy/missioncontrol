import { CalendarEvent } from '../../core/models/calendar.model';

export interface CalendarDay {
  /** Local date as `YYYY-MM-DD`. */
  key: string;
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

/** Long events (e.g. holidays) are cut off after this many days to keep the grid cheap. */
const MAX_EVENT_DAYS = 62;
const DAY_MS = 24 * 60 * 60 * 1000;

export function localDateKey(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Days an event covers, as local date keys. All-day events carry their date at 00:00 UTC and an
 * exclusive end date; timed events are placed on the local days between start and end.
 */
export function eventDayKeys(event: CalendarEvent): string[] {
  if (event.allDay) {
    const start = Date.parse(event.startsAt.slice(0, 10));
    const end = event.endsAt ? Date.parse(event.endsAt.slice(0, 10)) : start + DAY_MS;
    const keys: string[] = [];

    for (let day = start; day < Math.max(end, start + DAY_MS); day += DAY_MS) {
      keys.push(new Date(day).toISOString().slice(0, 10));

      if (keys.length === MAX_EVENT_DAYS) {
        break;
      }
    }

    return keys;
  }

  const start = new Date(event.startsAt);
  // An end at exactly midnight belongs to the previous day
  const end = event.endsAt ? new Date(Date.parse(event.endsAt) - 1) : start;
  const keys: string[] = [];
  const day = new Date(start.getFullYear(), start.getMonth(), start.getDate());

  do {
    keys.push(localDateKey(day));
    day.setDate(day.getDate() + 1);
  } while (day <= end && keys.length < MAX_EVENT_DAYS);

  return keys;
}

/** Full weeks (Monday first) around `month`, each day with its events: all-day first, then by time. */
export function buildMonth(
  month: Date,
  events: CalendarEvent[],
  today = new Date(),
): CalendarDay[] {
  const byDay = new Map<string, CalendarEvent[]>();

  for (const event of events) {
    for (const key of eventDayKeys(event)) {
      byDay.set(key, [...(byDay.get(key) ?? []), event]);
    }
  }

  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const start = new Date(first);
  start.setDate(first.getDate() - ((first.getDay() + 6) % 7));
  const end = new Date(last);
  end.setDate(last.getDate() + (6 - ((last.getDay() + 6) % 7)));
  const todayKey = localDateKey(today);
  const days: CalendarDay[] = [];

  for (const date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const key = localDateKey(date);
    days.push({
      key,
      date: new Date(date),
      inMonth: date.getMonth() === month.getMonth(),
      isToday: key === todayKey,
      events: [...(byDay.get(key) ?? [])].sort(
        (a, b) =>
          Number(!!b.allDay) - Number(!!a.allDay) ||
          Date.parse(a.startsAt) - Date.parse(b.startsAt),
      ),
    });
  }

  return days;
}
