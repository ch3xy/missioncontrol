import { CalendarSource } from './calendar.model';

export interface MissionControlSettings {
  veloUrl: string;
  dashUrl: string;
  sevDeskUrl: string;
  calendarSource: CalendarSource;
  calendarSourceUrl?: string;
  veloSourceUrl?: string;
  dashSourceUrl?: string;
}

export const DEFAULT_SETTINGS: MissionControlSettings = {
  veloUrl: 'http://localhost:4201',
  dashUrl: 'http://localhost:4202',
  sevDeskUrl: 'https://my.sevdesk.de',
  calendarSource: 'mock',
};
