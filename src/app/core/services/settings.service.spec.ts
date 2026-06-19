import { TestBed } from '@angular/core/testing';
import { createMemoryStorage } from '../../testing/memory-storage';
import { DEFAULT_SETTINGS } from '../models/settings.model';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should expose default external urls', () => {
    const service = TestBed.inject(SettingsService);

    expect(service.settings()).toEqual(DEFAULT_SETTINGS);
    expect(service.externalUrls()).toEqual({
      velo: DEFAULT_SETTINGS.veloUrl,
      dash: DEFAULT_SETTINGS.dashUrl,
      sevdesk: DEFAULT_SETTINGS.sevDeskUrl,
    });
  });

  it('should persist updated settings', () => {
    const service = TestBed.inject(SettingsService);

    service.updateSettings({
      ...DEFAULT_SETTINGS,
      veloUrl: 'http://localhost:4301',
      dashUrl: 'http://localhost:4302',
      sevDeskUrl: 'https://example.test',
    });

    const freshService = TestBed.inject(SettingsService);
    expect(freshService.settings().veloUrl).toBe('http://localhost:4301');
    expect(localStorage.getItem('mission-control.settings')).toContain(
      'localhost:4301',
    );
  });
});
