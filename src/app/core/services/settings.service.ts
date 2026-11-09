import { Injectable, computed, inject, signal } from '@angular/core';
import { CalendarSource } from '../models/calendar.model';
import { isRecord } from './local-json-source';
import { SettingsApi, SettingsApiResult } from './settings-api';
import {
  AUTO_REFRESH_MINUTES,
  AutoRefreshMinutes,
  DEFAULT_SETTINGS,
  MissionControlSettings,
} from '../models/settings.model';

/** Settings as read from the backend or an imported file: any field may hold any JSON value. */
type RawSettings = Partial<Record<keyof MissionControlSettings, unknown>>;

/** `loading` until the first answer, `unavailable` when the backend could not be read. */
export type SettingsStatus = 'loading' | 'ready' | 'unavailable';

export type SaveResult =
  | { ok: true }
  | { ok: false; reason: 'unavailable' }
  | { ok: false; reason: 'forbidden' }
  | { ok: false; reason: 'invalid'; detail: string };

/**
 * The backend (`backend/`, `GET`/`PUT /api/v1/settings`) is the only store for these settings.
 * Until it answers, and when it cannot be reached, the defaults apply and nothing can be saved;
 * there is no copy in LocalStorage (decision 2026-11-09).
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly api = inject(SettingsApi);
  private readonly settingsState = signal<MissionControlSettings>(DEFAULT_SETTINGS);
  private readonly statusState = signal<SettingsStatus>('loading');
  private loaded: Promise<void>;
  /** Only the latest load or save may set the state; an older answer arriving late is outdated. */
  private generation = 0;

  readonly settings = this.settingsState.asReadonly();
  readonly status = this.statusState.asReadonly();
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

  constructor() {
    this.loaded = this.load();
  }

  /** Resolves once the first load finished, successful or not. */
  whenLoaded(): Promise<void> {
    return this.loaded;
  }

  /** Loads again, e.g. after the backend was unavailable. */
  reload(): Promise<void> {
    this.statusState.set('loading');
    this.loaded = this.load();
    return this.loaded;
  }

  async updateSettings(settings: MissionControlSettings): Promise<SaveResult> {
    // Without loaded settings a save would overwrite the stored ones with defaults
    if (this.statusState() !== 'ready') {
      return { ok: false, reason: 'unavailable' };
    }

    const result = await this.api.put(toRequest(normalizeSettings(settings)));

    if (result.kind === 'invalid') {
      return { ok: false, reason: 'invalid', detail: result.detail };
    }

    if (result.kind === 'forbidden') {
      return { ok: false, reason: 'forbidden' };
    }

    const saved = toSettings(result);

    if (!saved) {
      // Unknown whether the backend stored anything (e.g. it went away mid-request): show its real state
      void this.reload();
      return { ok: false, reason: 'unavailable' };
    }

    // The saved state is the newest; a load still in flight must not overwrite it
    this.generation++;
    this.settingsState.set(saved);
    this.statusState.set('ready');
    return { ok: true };
  }

  exportSettings(): string {
    return JSON.stringify(this.settingsState(), null, 2);
  }

  /** `null` when the file is not a settings object; otherwise the result of saving it. */
  async importSettings(rawSettings: string): Promise<SaveResult | null> {
    let parsed: unknown;

    try {
      parsed = JSON.parse(rawSettings);
    } catch {
      return null;
    }

    // `null`, arrays or plain values would silently reset everything to the defaults
    if (!isRecord(parsed) || Array.isArray(parsed)) {
      return null;
    }

    return this.updateSettings({ ...DEFAULT_SETTINGS, ...parsed });
  }

  resetSettings(): Promise<SaveResult> {
    return this.updateSettings(DEFAULT_SETTINGS);
  }

  private async load(): Promise<void> {
    const generation = ++this.generation;
    const settings = toSettings(await this.api.get());

    if (generation !== this.generation) {
      return;
    }

    if (settings) {
      this.settingsState.set(settings);
      this.statusState.set('ready');
    } else {
      this.statusState.set('unavailable');
    }
  }
}

function toSettings(result: SettingsApiResult): MissionControlSettings | null {
  return result.kind === 'ok' && isRecord(result.payload) && !Array.isArray(result.payload)
    ? normalizeSettings({ ...DEFAULT_SETTINGS, ...result.payload })
    : null;
}

/** The backend stores optional fields as empty strings and expects every field on PUT. */
function toRequest(
  settings: MissionControlSettings,
): Record<keyof MissionControlSettings, unknown> {
  return {
    ...settings,
    calendarSourceUrl: settings.calendarSourceUrl ?? '',
    veloSourceUrl: settings.veloSourceUrl ?? '',
    dashSourceUrl: settings.dashSourceUrl ?? '',
    veloApiUrl: settings.veloApiUrl ?? '',
    dashApiUrl: settings.dashApiUrl ?? '',
  };
}

/** Backend and imported values are untyped JSON, so every field is checked at runtime. */
export function normalizeSettings(settings: RawSettings): MissionControlSettings {
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

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Optional source fields stay as entered (several URLs per line). Anything but a string, and the
 * empty string the backend uses for "not set", becomes `undefined`.
 */
function optionalText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
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
