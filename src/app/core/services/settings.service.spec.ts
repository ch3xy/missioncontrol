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
      localTool1: DEFAULT_SETTINGS.localTool1Url,
      localTool2: DEFAULT_SETTINGS.localTool2Url,
    });
  });

  it('should persist updated settings', () => {
    const service = TestBed.inject(SettingsService);

    service.updateSettings({
      ...DEFAULT_SETTINGS,
      veloUrl: 'http://localhost:4301',
      dashUrl: 'http://localhost:4302',
      sevDeskUrl: 'https://example.test',
      localTool1Label: 'Docs',
      localTool1Url: 'http://localhost:8080',
    });

    const freshService = TestBed.inject(SettingsService);
    expect(freshService.settings().veloUrl).toBe('http://localhost:4301');
    expect(freshService.localTools()[0]).toEqual({
      id: 'local-tool-1',
      label: 'Docs',
      url: 'http://localhost:8080',
    });
    expect(localStorage.getItem('mission-control.settings')).toContain('localhost:4301');
  });

  it('should export and import settings JSON', () => {
    const service = TestBed.inject(SettingsService);

    service.updateSettings({
      ...DEFAULT_SETTINGS,
      veloUrl: 'http://localhost:4401',
      localTool1Label: 'NAS',
      localTool1Url: 'http://localhost:8080',
    });
    const exportedSettings = service.exportSettings();

    service.resetSettings();
    expect(service.settings().veloUrl).toBe(DEFAULT_SETTINGS.veloUrl);

    expect(service.importSettings(exportedSettings)).toBe(true);
    expect(service.settings().veloUrl).toBe('http://localhost:4401');
    expect(service.settings().localTool1Label).toBe('NAS');
    expect(service.importSettings('{broken')).toBe(false);
  });
});
