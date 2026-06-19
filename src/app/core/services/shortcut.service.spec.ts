import { TestBed } from '@angular/core/testing';
import { createMemoryStorage } from '../../testing/memory-storage';
import { DEFAULT_SETTINGS } from '../models/settings.model';
import { SettingsService } from './settings.service';
import { ShortcutService } from './shortcut.service';

describe('ShortcutService', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should expose MVP shortcuts', () => {
    const service = TestBed.inject(ShortcutService);

    expect(service.shortcuts().map((shortcut) => shortcut.id)).toEqual([
      'velo',
      'dash',
      'sevdesk',
      'calendar',
    ]);
  });

  it('should expose configured local tool shortcuts', () => {
    TestBed.inject(SettingsService).updateSettings({
      ...DEFAULT_SETTINGS,
      localTool1Label: 'NAS',
      localTool1Url: 'http://localhost:8080',
    });
    const service = TestBed.inject(ShortcutService);

    expect(service.shortcuts().map((shortcut) => shortcut.id)).toContain('local-tool-1');
  });

  it('should reject non-http urls', () => {
    const service = TestBed.inject(ShortcutService);

    expect(service.canOpenUrl('ftp://example.test')).toBe(false);
    expect(service.canOpenUrl('http://localhost:4201')).toBe(true);
    expect(service.canOpenUrl('https://my.sevdesk.de')).toBe(true);
  });
});
