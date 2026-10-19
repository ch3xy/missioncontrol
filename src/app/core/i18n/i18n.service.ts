import { Injectable, computed, signal } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeDeAt from '@angular/common/locales/de-AT';
import { DE, Dictionary, EN, TranslationKey } from './translations';

export type Language = 'de' | 'en';
export type TranslationParams = Record<string, string | number | null | undefined>;

export const LANGUAGES: Language[] = ['de', 'en'];
export const LANGUAGE_LABELS: Record<Language, string> = { de: 'Deutsch', en: 'English' };
/** Arrow convention: `<product>-<setting>` (see docs/arrow-corporate-design.md, section 9). */
export const LANGUAGE_STORAGE_KEY = 'missioncontrol-lang';
export const DEFAULT_LANGUAGE: Language = 'de';

const DICTIONARIES: Record<Language, Dictionary> = { de: DE, en: EN };
/** Locale IDs for Angular's date/number/currency pipes. `en-US` ships with Angular. */
const LOCALES: Record<Language, string> = { de: 'de-AT', en: 'en-US' };

registerLocaleData(localeDeAt);

/** Signal-based UI translation: reading `t()` inside templates/computeds re-renders on switch. */
@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly lang = signal<Language>(this.readLanguage());
  readonly locale = computed(() => LOCALES[this.lang()]);

  constructor() {
    this.apply();
  }

  t(key: TranslationKey, params?: TranslationParams): string {
    const text = DICTIONARIES[this.lang()][key];
    return params
      ? text.replace(/\{(\w+)\}/g, (match, name: string) => String(params[name] ?? match))
      : text;
  }

  setLanguage(lang: Language): void {
    this.lang.set(lang);
    try {
      globalThis.localStorage?.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      /* storage unavailable — keep in-memory language only */
    }
    this.apply();
  }

  private apply(): void {
    globalThis.document?.documentElement.setAttribute('lang', this.lang());
  }

  private readLanguage(): Language {
    try {
      const stored = globalThis.localStorage?.getItem(LANGUAGE_STORAGE_KEY);
      return stored === 'de' || stored === 'en' ? stored : DEFAULT_LANGUAGE;
    } catch {
      return DEFAULT_LANGUAGE;
    }
  }
}
