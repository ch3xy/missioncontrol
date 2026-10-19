import { createMemoryStorage } from '../../testing/memory-storage';
import { THEME_STORAGE_KEY, ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should default to system mode and resolve to light or dark', () => {
    const service = new ThemeService();

    expect(service.mode()).toBe('system');
    expect(['light', 'dark']).toContain(service.theme());
  });

  it('should pin explicit modes and set data-theme on the document', () => {
    const service = new ThemeService();

    service.setMode('dark');
    expect(service.theme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    service.setMode('light');
    expect(service.theme()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('should toggle between light and dark', () => {
    const service = new ThemeService();
    const first = service.theme();

    service.toggle();
    expect(service.theme()).not.toBe(first);

    service.toggle();
    expect(service.theme()).toBe(first);
  });

  it('should persist the mode and restore it in a new instance', () => {
    new ThemeService().setMode('dark');

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(new ThemeService().mode()).toBe('dark');
  });
});
