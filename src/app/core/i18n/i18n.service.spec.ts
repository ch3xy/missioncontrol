import { TestBed } from '@angular/core/testing';
import { createMemoryStorage } from '../../testing/memory-storage';
import { I18nService, LANGUAGE_STORAGE_KEY } from './i18n.service';
import { DE, EN } from './translations';

describe('I18nService', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should default to German with the de-AT locale', () => {
    const i18n = TestBed.inject(I18nService);

    expect(i18n.lang()).toBe('de');
    expect(i18n.locale()).toBe('de-AT');
    expect(i18n.t('nav.settings')).toBe('Einstellungen');
    expect(document.documentElement.lang).toBe('de');
  });

  it('should switch and persist the language', () => {
    const i18n = TestBed.inject(I18nService);

    i18n.setLanguage('en');

    expect(i18n.t('nav.settings')).toBe('Settings');
    expect(i18n.locale()).toBe('en-US');
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('should restore a stored language', () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');

    expect(TestBed.inject(I18nService).lang()).toBe('en');
  });

  it('should fill placeholders', () => {
    const i18n = TestBed.inject(I18nService);

    expect(i18n.t('common.noValidUrl', { name: 'Velo' })).toBe(
      'Für Velo ist keine gültige http(s)-URL konfiguriert.',
    );
  });

  it('should provide a non-empty German text for every key', () => {
    const missing = Object.keys(EN).filter((key) => !DE[key as keyof typeof EN]?.trim());

    expect(missing).toEqual([]);
  });
});
