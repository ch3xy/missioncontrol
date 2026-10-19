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
  source: Exclude<CalendarSource, 'none'>;
}

export interface CalendarAdapter {
  getEvents(): Promise<CalendarEvent[]>;
}
