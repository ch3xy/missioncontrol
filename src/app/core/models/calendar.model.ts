/** Configured calendar source; `none` shows no appointments. */
export type CalendarSource = 'none' | 'ics' | 'local-json';

export interface CalendarEvent {
  id: string;
  title: string;
  startsAt: string;
  endsAt?: string;
  project?: string;
  customer?: string;
  location?: string;
  /** All-day event: `startsAt` is 00:00 UTC of its date and carries no time of day. */
  allDay?: boolean;
  /** Name of the calendar the event belongs to, e.g. from `X-WR-CALNAME`. */
  calendar?: string;
  /** CSS color of that calendar (`#rrggbb` or a color keyword). */
  color?: string;
  source: Exclude<CalendarSource, 'none'>;
}

export interface CalendarAdapter {
  getEvents(): Promise<CalendarEvent[]>;
}

/**
 * True until the event is over: timed events until their end (or start, without an end), all-day
 * events until the end of their last day in local time.
 */
export function isUpcoming(event: CalendarEvent, now = new Date()): boolean {
  if (event.allDay) {
    const pad = (value: number) => String(value).padStart(2, '0');
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    // The end date is exclusive; without one the event covers its start date only
    return event.endsAt ? event.endsAt.slice(0, 10) > today : event.startsAt.slice(0, 10) >= today;
  }

  return Date.parse(event.endsAt ?? event.startsAt) > now.getTime();
}
