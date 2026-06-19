import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { createMemoryStorage } from '../testing/memory-storage';
import { CalendarPage } from './calendar/calendar-page';
import { DashPage } from './dash/dash-page';
import { Dashboard } from './dashboard/dashboard';
import { SettingsPage } from './settings/settings-page';
import { VeloPage } from './velo/velo-page';

describe('feature pages', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should create the dashboard page', async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(Dashboard);
    await fixture.whenStable();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should create the calendar page', async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarPage],
    }).compileComponents();

    const fixture = TestBed.createComponent(CalendarPage);
    await fixture.whenStable();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should create the Velo page', async () => {
    await TestBed.configureTestingModule({
      imports: [VeloPage],
    }).compileComponents();

    const fixture = TestBed.createComponent(VeloPage);
    await fixture.whenStable();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should create the Dash page', async () => {
    await TestBed.configureTestingModule({
      imports: [DashPage],
    }).compileComponents();

    const fixture = TestBed.createComponent(DashPage);
    await fixture.whenStable();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should create the settings page', async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsPage],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(SettingsPage);
    await fixture.whenStable();

    expect(fixture.componentInstance).toBeTruthy();
  });
});
