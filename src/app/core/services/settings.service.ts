import { Injectable, computed, signal } from '@angular/core';
import { DEFAULT_SETTINGS, MissionControlSettings } from '../models/settings.model';

const STORAGE_KEY = 'mission-control.settings';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly settingsState = signal<MissionControlSettings>(this.readSettings());

  readonly settings = this.settingsState.asReadonly();
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  }

  resetSettings(): void {
    this.updateSettings(DEFAULT_SETTINGS);
  }

  private readSettings(): MissionControlSettings {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return DEFAULT_SETTINGS;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<MissionControlSettings>;
      return this.normalizeSettings({ ...DEFAULT_SETTINGS, ...parsed });
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  private normalizeSettings(settings: MissionControlSettings): MissionControlSettings {
    return {
      ...DEFAULT_SETTINGS,
      ...settings,
      veloUrl: settings.veloUrl.trim() || DEFAULT_SETTINGS.veloUrl,
      dashUrl: settings.dashUrl.trim() || DEFAULT_SETTINGS.dashUrl,
      sevDeskUrl: settings.sevDeskUrl.trim() || DEFAULT_SETTINGS.sevDeskUrl,
      calendarSource: settings.calendarSource ?? DEFAULT_SETTINGS.calendarSource,
      localTool1Label: settings.localTool1Label.trim() || DEFAULT_SETTINGS.localTool1Label,
      localTool1Url: settings.localTool1Url.trim(),
      localTool2Label: settings.localTool2Label.trim() || DEFAULT_SETTINGS.localTool2Label,
      localTool2Url: settings.localTool2Url.trim(),
    };
  }
}
