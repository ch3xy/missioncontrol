import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TaskApi } from '../../core/services/task-api';
import { InMemoryTaskApi } from '../../testing/in-memory-task-api';
import { createMemoryStorage } from '../../testing/memory-storage';
import { localDateKey } from '../calendar/calendar-month';
import { TodayWidget } from './today-widget';

describe('TodayWidget', () => {
  const today = localDateKey(new Date());

  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function render() {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const api = TestBed.inject(TaskApi) as InMemoryTaskApi;
    await api.create('Angebot schreiben', 90, today);
    await api.create('Rechnung prüfen', null, today);
    await api.create('Idee', null, null);
    const fixture = TestBed.createComponent(TodayWidget);
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const settle = async () => {
      await fixture.whenStable();
      fixture.detectChanges();
    };
    return { api, element, settle };
  }

  it('should show today’s tasks, progress and the brain dump count', async () => {
    const { element } = await render();

    expect(element.textContent).toContain('Angebot schreiben');
    expect(element.textContent).toContain('0 von 2 Aufgaben erledigt');
    expect(element.textContent).toContain('Brain-Dump: 1');
    expect(element.textContent).not.toContain('Idee');
  });

  it('should mark a task as done and reopen it', async () => {
    const { api, element, settle } = await render();
    const check = () =>
      element.querySelector<HTMLButtonElement>('button[aria-label^="„Angebot schreiben“"]');

    check()?.click();
    await settle();
    expect(api.tasks.find((task) => task.title === 'Angebot schreiben')?.status).toBe('DONE');
    expect(element.textContent).toContain('1 von 2 Aufgaben erledigt');

    check()?.click();
    await settle();
    expect(api.tasks.find((task) => task.title === 'Angebot schreiben')?.status).toBe('OPEN');
  });

  it('should start a task', async () => {
    const { api, element, settle } = await render();

    element
      .querySelector<HTMLButtonElement>('button[aria-label="„Rechnung prüfen“ starten"]')
      ?.click();
    await settle();

    expect(api.tasks.find((task) => task.title === 'Rechnung prüfen')?.status).toBe('IN_PROGRESS');
  });

  it('should add a task to today or to the brain dump', async () => {
    const { api, element, settle } = await render();
    const input = element.querySelector<HTMLInputElement>('input')!;
    const type = async (value: string) => {
      input.value = value;
      input.dispatchEvent(new Event('input'));
      await settle();
    };

    await type('Steuerberater anrufen');
    element.querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit'));
    await settle();
    expect(api.tasks.find((task) => task.title === 'Steuerberater anrufen')?.planDate).toBe(today);

    await type('Später');
    element.querySelector<HTMLButtonElement>('button[type="button"].btn-icon')?.click();
    await settle();
    expect(api.tasks.find((task) => task.title === 'Später')?.planDate).toBeNull();
  });

  it('should not add an empty task', async () => {
    const { api, element, settle } = await render();

    element.querySelector<HTMLFormElement>('form')?.dispatchEvent(new Event('submit'));
    await settle();

    expect(api.tasks).toHaveLength(3);
  });

  it('should offer the carry-over and take it over', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const api = TestBed.inject(TaskApi) as InMemoryTaskApi;
    await api.create('Liegen geblieben', 30, '2000-01-01');
    const fixture = TestBed.createComponent(TodayWidget);
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('1 offen von früheren Tagen');
    const takeOver = [...element.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Alle übernehmen',
    );
    takeOver?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(api.tasks[0].planDate).toBe(today);
    expect(element.textContent).not.toContain('offen von früheren Tagen');
  });

  it('should show a notice and lock the inputs while the backend is unavailable', async () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    (TestBed.inject(TaskApi) as InMemoryTaskApi).available = false;
    const fixture = TestBed.createComponent(TodayWidget);
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('[role="alert"]')).not.toBeNull();
    expect(element.querySelector<HTMLInputElement>('input')?.disabled).toBe(true);
    expect(element.querySelector<HTMLButtonElement>('button[type="submit"]')?.disabled).toBe(true);
  });

  it('should show the reason of a failed change and dismiss it', async () => {
    const { api, element, settle } = await render();
    api.available = false;

    element.querySelector<HTMLButtonElement>('button[aria-label^="„Angebot schreiben“"]')?.click();
    await settle();
    // The reload after the failed change fails as well, so the unavailable notice is shown too
    expect(element.textContent).toContain('Das Backend hat die Änderung nicht bestätigt');

    api.available = true;
    [...element.querySelectorAll<HTMLButtonElement>('[role="alert"] button')]
      .find((button) => button.textContent?.trim() === 'Schließen')
      ?.click();
    await settle();
    expect(element.textContent).not.toContain('Das Backend hat die Änderung nicht bestätigt');
  });
});
