import { Injectable, computed, signal } from '@angular/core';
import { CalendarSource } from '../models/calendar.model';
import { isRecord } from './local-json-source';
import {
  AUTO_REFRESH_MINUTES,
  AutoRefreshMinutes,
  DEFAULT_SETTINGS,
  MissionControlSettings,
} from '../models/settings.model';

const STORAGE_KEY = 'mission-control.settings';

/** Settings as read from storage or an imported file: any field may hold any JSON value. */
type RawSettings = Partial<Record<keyof MissionControlSettings, unknown>>;

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly settingsState = signal<MissionControlSettings>(this.readSettings());
  private readonly persistedState = signal(true);

  readonly settings = this.settingsState.asReadonly();
  /** False when the last change could not be written to LocalStorage and only lasts this session. */
  readonly persisted = this.persistedState.asReadonly();
  readonly externalUrls = computed(() => ({
    velo: this.settingsState().veloUrl,
    dash: this.settingsState().dashUrl,
    sevdesk: this.settingsState().sevDeskUrl,
    localTool1: this.settingsState().localTool1Url,
    localTool2: this.settingsState().localTool2Url,
  }));
  readonly localTools = computed(() => [
    {
      id: 'local-tool-1' as const,
      label: this.settingsState().localTool1Label,
      url: this.settingsState().localTool1Url,
    },
    {
      id: 'local-tool-2' as const,
      label: this.settingsState().localTool2Label,
      url: this.settingsState().localTool2Url,
    },
  ]);

  updateSettings(settings: MissionControlSettings): void {
    const normalized = this.normalizeSettings(settings);
    this.settingsState.set(normalized);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      this.persistedState.set(true);
    } catch {
      // Storage blocked or full: keep the settings for this session and say so
      this.persistedState.set(false);
    }
  }

  exportSettings(): string {
    return JSON.stringify(this.settingsState(), null, 2);
  }

  importSettings(rawSettings: string): boolean {
    let parsed: unknown;

    try {
      parsed = JSON.parse(rawSettings);
    } catch {
      return false;
    }

    // `null`, arrays or plain values would silently reset everything to the defaults
    if (!isRecord(parsed) || Array.isArray(parsed)) {
      return false;
    }

    this.updateSettings({ ...DEFAULT_SETTINGS, ...parsed });
    return true;
  }

  resetSettings(): void {
    this.updateSettings(DEFAULT_SETTINGS);
  }

  private readSettings(): MissionControlSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      return isRecord(parsed)
        ? this.normalizeSettings({ ...DEFAULT_SETTINGS, ...parsed })
        : DEFAULT_SETTINGS;
    } catch {
      // Unreadable JSON or storage access denied (e.g. site data blocked)
      return DEFAULT_SETTINGS;
    }
  }

  /** Imported or stored values are untyped JSON, so every field is checked at runtime. */
  private normalizeSettings(settings: RawSettings): MissionControlSettings {
    return {
      veloUrl: text(settings.veloUrl) || DEFAULT_SETTINGS.veloUrl,
      dashUrl: text(settings.dashUrl) || DEFAULT_SETTINGS.dashUrl,
      sevDeskUrl: text(settings.sevDeskUrl) || DEFAULT_SETTINGS.sevDeskUrl,
      calendarSourceUrl: optionalText(settings.calendarSourceUrl),
      veloSourceUrl: optionalText(settings.veloSourceUrl),
      dashSourceUrl: optionalText(settings.dashSourceUrl),
      veloApiUrl: optionalText(settings.veloApiUrl),
      dashApiUrl: optionalText(settings.dashApiUrl),
      calendarSource: isCalendarSource(settings.calendarSource)
        ? settings.calendarSource
        : DEFAULT_SETTINGS.calendarSource,
      dailyTargetHours: isValidTargetHours(settings.dailyTargetHours)
        ? settings.dailyTargetHours
        : DEFAULT_SETTINGS.dailyTargetHours,
      autoRefreshMinutes: isAutoRefreshMinutes(settings.autoRefreshMinutes)
        ? settings.autoRefreshMinutes
        : DEFAULT_SETTINGS.autoRefreshMinutes,
      localTool1Label: text(settings.localTool1Label) || DEFAULT_SETTINGS.localTool1Label,
      localTool1Url: text(settings.localTool1Url),
      localTool2Label: text(settings.localTool2Label) || DEFAULT_SETTINGS.localTool2Label,
      localTool2Url: text(settings.localTool2Url),
    };
  }
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/** Optional source fields stay as entered (several URLs per line); anything but a string is dropped. */
function optionalText(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

/** Also maps the removed `mock` source of older settings to the default. */
function isCalendarSource(value: unknown): value is CalendarSource {
  return value === 'none' || value === 'ics' || value === 'local-json';
}

function isValidTargetHours(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 24;
}

/** Unknown intervals (e.g. from an edited backup) fall back to the default. */
function isAutoRefreshMinutes(value: unknown): value is AutoRefreshMinutes {
  return AUTO_REFRESH_MINUTES.some((minutes) => minutes === value);
}
