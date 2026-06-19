import { CalendarSource } from './calendar.model';

export interface MissionControlSettings {
  veloUrl: string;
  dashUrl: string;
  sevDeskUrl: string;
  calendarSource: CalendarSource;
  calendarSourceUrl?: string;
  veloSourceUrl?: string;
  dashSourceUrl?: string;
  localTool1Label: string;
  localTool1Url: string;
  localTool2Label: string;
  localTool2Url: string;
}

export const DEFAULT_SETTINGS: MissionControlSettings = {
  veloUrl: 'http://localhost:4201',
  dashUrl: 'http://localhost:4202',
  sevDeskUrl: 'https://my.sevdesk.de',
  calendarSource: 'mock',
  localTool1Label: 'Local Tool 1',
  localTool1Url: '',
  localTool2Label: 'Local Tool 2',
  localTool2Url: '',
};
