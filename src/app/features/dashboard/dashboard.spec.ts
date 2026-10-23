import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DEFAULT_SETTINGS } from '../../core/models/settings.model';
import { DashAdapterService } from '../../core/services/dash-adapter.service';
import { SettingsService } from '../../core/services/settings.service';
import { createMemoryStorage } from '../../testing/memory-storage';
import { Dashboard } from './dashboard';

describe('Dashboard background refresh', () => {
  let hidden = false;

  beforeEach(() => {
    hidden = false;
    vi.stubGlobal('localStorage', createMemoryStorage());
    vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  async function createDashboard(autoRefreshMinutes: 0 | 5) {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    TestBed.inject(SettingsService).updateSettings({ ...DEFAULT_SETTINGS, autoRefreshMinutes });
    const getSummary = vi.spyOn(TestBed.inject(DashAdapterService), 'getSummary');

    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(0);

    return { fixture, getSummary };
  }

  it('should reload on every interval while visible', async () => {
    const { getSummary } = await createDashboard(5);
    expect(getSummary).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(5 * 60_000);
    expect(getSummary).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(5 * 60_000);
    expect(getSummary).toHaveBeenCalledTimes(3);
  });

  it('should pause while hidden and catch up when visible again', async () => {
    const { getSummary } = await createDashboard(5);

    hidden = true;
    await vi.advanceTimersByTimeAsync(10 * 60_000);
    expect(getSummary).toHaveBeenCalledTimes(1);

    hidden = false;
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(0);
    expect(getSummary).toHaveBeenCalledTimes(2);
  });

  it('should not reload on a quick tab switch', async () => {
    const { getSummary } = await createDashboard(5);

    await vi.advanceTimersByTimeAsync(60_000);
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(0);

    expect(getSummary).toHaveBeenCalledTimes(1);
  });

  it('should not reload when turned off', async () => {
    const { getSummary } = await createDashboard(0);

    await vi.advanceTimersByTimeAsync(30 * 60_000);

    expect(getSummary).toHaveBeenCalledTimes(1);
  });

  it('should stop reloading once destroyed', async () => {
    const { fixture, getSummary } = await createDashboard(5);

    fixture.destroy();
    await vi.advanceTimersByTimeAsync(10 * 60_000);

    expect(getSummary).toHaveBeenCalledTimes(1);
  });
});
