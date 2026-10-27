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
/** Occurrences scheduled after the window can be moved into it, so the expansion looks a bit further. */
const MOVED_OCCURRENCE_SLACK_MS = 31 * 24 * 60 * 60 * 1000;

/**
 * Parses a VCALENDAR into events. Recurring events (RRULE/RDATE) are expanded into one event per
 * occurrence inside `window`, honouring EXDATE and moved or changed occurrences (RECURRENCE-ID).
 * Non-recurring events are returned regardless of the window. Throws on text that is not iCalendar.
 */
export function parseIcsEvents(
  icsText: string,
  window: IcsWindow = defaultWindow(),
): CalendarEvent[] {
  const calendar = new ICAL.Component(ICAL.parse(icsText.trim()));

  // Without its VTIMEZONE a TZID is treated as floating time, i.e. the browser's time zone.
  for (const timezone of calendar.getAllSubcomponents('vtimezone')) {
    try {
      ICAL.TimezoneService.register(timezone);
    } catch {
      // A broken VTIMEZONE (e.g. without TZID) must not cost the whole calendar.
    }
  }

  const meta = calendarMeta(calendar);

  const vevents = calendar.getAllSubcomponents('vevent');
  // ical.js cannot compute an end without a start; such entries are not appointments anyway.
  const components = vevents.filter((component) => component.hasProperty('dtstart'));
  const masters = components.filter(
    (component) => !component.hasProperty('recurrence-id') && !isCancelled(component),
  );
  const exceptions = components.filter(
    (component) => component.hasProperty('recurrence-id') && !isCancelled(component),
  );
  // Cancelled single occurrences often come without DTSTART; they act like an EXDATE.
  const cancellations = vevents.filter(
    (component) => component.hasProperty('recurrence-id') && isCancelled(component),
  );
  // Includes cancelled series, whose changed occurrences are cancelled with them.
  const masterUids = new Set(
    vevents
      .filter((component) => !component.hasProperty('recurrence-id'))
      .map((component) => component.getFirstPropertyValue('uid')),
  );
  const sameUid = (uid: unknown) => (component: ICAL.Component) =>
    component.getFirstPropertyValue('uid') === uid;

  return [
    ...masters.flatMap((component) => {
      const uid = component.getFirstPropertyValue('uid');
      // Without explicit exceptions ical.js relates every RECURRENCE-ID of the file, whatever its UID.
      const event = new ICAL.Event(component, { exceptions: exceptions.filter(sameUid(uid)) });

      if (!event.isRecurring()) {
        return [toCalendarEvent(event, event.startDate, event.endDate, meta)];
      }

      const cancelled = new Set(cancellations.filter(sameUid(uid)).map(recurrenceIdTime));
      return expandOccurrences(event, window, meta, cancelled);
    }),
    // A changed occurrence whose series is not in the file is still a real appointment.
    ...exceptions
      .filter((component) => !masterUids.has(component.getFirstPropertyValue('uid')))
      .map((component) => new ICAL.Event(component, { exceptions: [] }))
      .map((event) => toCalendarEvent(event, event.startDate, event.endDate, meta)),
  ];
}

function isCancelled(component: ICAL.Component): boolean {
  return String(component.getFirstPropertyValue('status') ?? '').toUpperCase() === 'CANCELLED';
}

function recurrenceIdTime(component: ICAL.Component): number {
  return (component.getFirstPropertyValue('recurrence-id') as ICAL.Time).toJSDate().getTime();
}

function expandOccurrences(
  event: ICAL.Event,
  window: IcsWindow,
  meta: CalendarMeta,
  cancelled: Set<number>,
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const iterator = event.iterator();
  const lastScheduled = window.to.getTime() + MOVED_OCCURRENCE_SLACK_MS;

  for (let i = 0; i < MAX_ITERATIONS_PER_EVENT; i++) {
    const next = iterator.next() as ICAL.Time | undefined;

    if (!next || next.toJSDate().getTime() > lastScheduled) {
      break;
    }

    if (cancelled.has(next.toJSDate().getTime())) {
      continue;
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
    // Without a UID the title keeps different events at the same time apart.
    id: event.uid || `ics-${startsAt}-${event.summary?.trim() ?? ''}`,
    title: event.summary?.trim() || 'Untitled event',
    startsAt,
    endsAt: endsAt === startsAt ? undefined : endsAt,
    location: event.location?.trim() || undefined,
    project: event.description?.trim() || undefined,
    allDay: start.isDate || undefined,
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

/** A year back and ahead from the current month, so past weeks and months show their series too. */
function defaultWindow(): IcsWindow {
  const today = new Date();
  return {
    from: new Date(today.getFullYear() - 1, today.getMonth(), 1),
    to: new Date(today.getFullYear() + 1, today.getMonth() + 1, 1),
  };
}
