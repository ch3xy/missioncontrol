import ICAL from 'ical.js';
import { CalendarEvent } from '../models/calendar.model';

/** Occurrences of recurring events are only generated inside this range. */
export interface IcsWindow {
  from: Date;
  to: Date;
}

type CalendarMeta = Pick<CalendarEvent, 'calendar' | 'color'>;

/** Guards against endless rules (no COUNT/UNTIL) and very old daily series. */
const MAX_ITERATIONS_PER_EVENT = 50_000;

/**
 * Parses a VCALENDAR into events. Recurring events (RRULE/RDATE) are expanded into one event per
 * occurrence inside `window`, honouring EXDATE and moved or changed occurrences (RECURRENCE-ID).
 * Non-recurring events are returned regardless of the window. Throws on text that is not iCalendar.
 */
export function parseIcsEvents(
  icsText: string,
  window: IcsWindow = upcomingYear(),
): CalendarEvent[] {
  const calendar = new ICAL.Component(ICAL.parse(icsText.trim()));

  // Without its VTIMEZONE a TZID is treated as floating time, i.e. the browser's time zone.
  for (const timezone of calendar.getAllSubcomponents('vtimezone')) {
    ICAL.TimezoneService.register(timezone);
  }

  const meta = calendarMeta(calendar);

  // ical.js cannot compute an end without a start; such entries are not appointments anyway.
  const components = calendar
    .getAllSubcomponents('vevent')
    .filter((component) => component.hasProperty('dtstart'));
  const masters = components.filter((component) => !component.hasProperty('recurrence-id'));
  const exceptions = components.filter((component) => component.hasProperty('recurrence-id'));
  const masterUids = new Set(masters.map((component) => component.getFirstPropertyValue('uid')));

  return [
    ...masters.flatMap((component) => {
      const event = new ICAL.Event(component);

      for (const exception of exceptions) {
        if (exception.getFirstPropertyValue('uid') === event.uid) {
          event.relateException(exception);
        }
      }

      return event.isRecurring()
        ? expandOccurrences(event, window, meta)
        : [toCalendarEvent(event, event.startDate, event.endDate, meta)];
    }),
    // A changed occurrence whose series is not in the file is still a real appointment.
    ...exceptions
      .filter((component) => !masterUids.has(component.getFirstPropertyValue('uid')))
      .map((component) => new ICAL.Event(component))
      .map((event) => toCalendarEvent(event, event.startDate, event.endDate, meta)),
  ];
}

function expandOccurrences(
  event: ICAL.Event,
  window: IcsWindow,
  meta: CalendarMeta,
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const iterator = event.iterator();

  for (let i = 0; i < MAX_ITERATIONS_PER_EVENT; i++) {
    const next = iterator.next() as ICAL.Time | undefined;

    if (!next || next.toJSDate() > window.to) {
      break;
    }

    const details = event.getOccurrenceDetails(next);
    const endsAt = (details.endDate ?? details.startDate).toJSDate();

    if (endsAt >= window.from && details.startDate.toJSDate() <= window.to) {
      events.push(toCalendarEvent(details.item, details.startDate, details.endDate, meta));
    }
  }

  return events;
}

function toCalendarEvent(
  event: ICAL.Event,
  start: ICAL.Time,
  end: ICAL.Time | null,
  meta: CalendarMeta,
): CalendarEvent {
  const startsAt = toIsoString(start);
  const endsAt = end ? toIsoString(end) : undefined;

  return {
    id: event.uid || `ics-${startsAt}`,
    title: event.summary?.trim() || 'Untitled event',
    startsAt,
    endsAt: endsAt === startsAt ? undefined : endsAt,
    location: event.location?.trim() || undefined,
    project: event.description?.trim() || undefined,
    ...meta,
    source: 'ics',
  };
}

/**
 * Calendar name and color as Apple writes them (`X-WR-CALNAME`, `X-APPLE-CALENDAR-COLOR`), falling
 * back to RFC 7986 `NAME` / `COLOR`.
 */
function calendarMeta(calendar: ICAL.Component): CalendarMeta {
  const text = (name: string): string | undefined => {
    const value = calendar.getFirstPropertyValue(name);
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  };

  return {
    calendar: text('x-wr-calname') ?? text('name'),
    color: normalizeColor(text('x-apple-calendar-color') ?? text('color')),
  };
}

/** Apple uses `#RRGGBBAA`; RFC 7986 uses CSS color keywords. Anything else is dropped. */
function normalizeColor(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})(?:[0-9a-f]{2})?$/i);

  if (hex) {
    return `#${hex[1].toLowerCase()}`;
  }

  return /^[a-z]+$/i.test(value) ? value.toLowerCase() : undefined;
}

/** All-day dates stay at 00:00 UTC of their day, so the agenda groups them under the right date. */
function toIsoString(time: ICAL.Time): string {
  if (time.isDate) {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${time.year}-${pad(time.month)}-${pad(time.day)}T00:00:00.000Z`;
  }

  return time.toJSDate().toISOString();
}

function upcomingYear(): IcsWindow {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setFullYear(to.getFullYear() + 1);
  return { from, to };
}
