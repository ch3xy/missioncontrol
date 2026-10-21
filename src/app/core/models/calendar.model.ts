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
  /** Name of the calendar the event belongs to, e.g. from `X-WR-CALNAME`. */
  calendar?: string;
  /** CSS color of that calendar (`#rrggbb` or a color keyword). */
  color?: string;
  source: Exclude<CalendarSource, 'none'>;
}

export interface CalendarAdapter {
  getEvents(): Promise<CalendarEvent[]>;
}
