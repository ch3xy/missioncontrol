import { CalendarSource } from './calendar.model';

export const AUTO_REFRESH_MINUTES = [0, 1, 5, 15, 30] as const;

export type AutoRefreshMinutes = (typeof AUTO_REFRESH_MINUTES)[number];

export interface MissionControlSettings {
  veloUrl: string;
  dashUrl: string;
  sevDeskUrl: string;
  calendarSource: CalendarSource;
  calendarSourceUrl?: string;
  veloSourceUrl?: string;
  dashSourceUrl?: string;
  /** Base URL of the velo app whose REST API is read, e.g. `https://arrow.local/velo`. */
  veloApiUrl?: string;
  /** Base URL of the dash app whose REST API is read, e.g. `https://arrow.local/dash`. */
  dashApiUrl?: string;
  /** dash has no daily target of its own. */
  dailyTargetHours: number;
  /** Interval of the dashboard background refresh; `0` turns it off. */
  autoRefreshMinutes: AutoRefreshMinutes;
  localTool1Label: string;
  localTool1Url: string;
  localTool2Label: string;
  localTool2Url: string;
}

export const DEFAULT_SETTINGS: MissionControlSettings = {
  veloUrl: 'http://localhost:4201',
  dashUrl: 'http://localhost:4202',
  sevDeskUrl: 'https://my.sevdesk.de',
  calendarSource: 'none',
  dailyTargetHours: 8,
  autoRefreshMinutes: 5,
  localTool1Label: 'Local Tool 1',
  localTool1Url: '',
  localTool2Label: 'Local Tool 2',
  localTool2Url: '',
};
