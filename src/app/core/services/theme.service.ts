import { Injectable, signal } from '@angular/core';
import { TranslationKey } from '../i18n/translations';

export type Theme = 'light' | 'dark';
/** User preference; 'system' follows the OS color scheme live. */
export type ThemeMode = Theme | 'system';

export const THEME_MODE_LABELS: Record<ThemeMode, TranslationKey> = {
  light: 'theme.light',
  dark: 'theme.dark',
  system: 'theme.system',
};

/** Arrow convention: `<product>-theme` (see docs/arrow-corporate-design.md, section 9). */
export const THEME_STORAGE_KEY = 'missioncontrol-theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

/** Same behavior as dash's ThemeService: sets `data-theme` on `<html>`. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly mode = signal<ThemeMode>(this.readMode());
  /** Effective theme after resolving 'system'. */
  readonly theme = signal<Theme>(this.resolve(this.mode()));

  constructor() {
    this.media()?.addEventListener?.('change', () => {
      if (this.mode() === 'system') {
        this.theme.set(this.resolve('system'));
        this.apply();
      }
    });
  }

  apply(): void {
    globalThis.document?.documentElement.setAttribute('data-theme', this.theme());
  }

  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
    this.theme.set(this.resolve(mode));
    try {
      globalThis.localStorage?.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      /* storage unavailable — keep in-memory theme only */
    }
    this.apply();
  }

  /** Topbar quick switch: pins the opposite of what is currently shown. */
  toggle(): void {
    this.setMode(this.theme() === 'dark' ? 'light' : 'dark');
  }

  private readMode(): ThemeMode {
    try {
      const stored = globalThis.localStorage?.getItem(THEME_STORAGE_KEY);
      return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
    } catch {
      return 'system';
    }
  }

  private media(): MediaQueryList | null {
    try {
      return globalThis.matchMedia?.(DARK_QUERY) ?? null;
    } catch {
      return null;
    }
  }

  private resolve(mode: ThemeMode): Theme {
    if (mode !== 'system') {
      return mode;
    }
    return this.media()?.matches ? 'dark' : 'light';
  }
}
