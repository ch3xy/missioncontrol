export type CalendarSource = 'mock' | 'ics' | 'local-json';

export interface CalendarEvent {
  id: string;
  title: string;
  startsAt: string;
  endsAt?: string;
  project?: string;
  customer?: string;
  location?: string;
  source: CalendarSource;
}

export interface CalendarAdapter {
  getEvents(): Promise<CalendarEvent[]>;
}
