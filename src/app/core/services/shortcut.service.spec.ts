import { TestBed } from '@angular/core/testing';
import { ShortcutService } from './shortcut.service';

describe('ShortcutService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
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

  it('should reject non-http urls', () => {
    const service = TestBed.inject(ShortcutService);

    expect(service.canOpenUrl('ftp://example.test')).toBe(false);
    expect(service.canOpenUrl('http://localhost:4201')).toBe(true);
    expect(service.canOpenUrl('https://my.sevdesk.de')).toBe(true);
  });
});
