import { TestBed } from '@angular/core/testing';
import { TaskApi } from '../../core/services/task-api';
import { createMemoryStorage } from '../../testing/memory-storage';
import { InMemoryTaskApi } from '../../testing/in-memory-task-api';
import { localDateKey } from '../calendar/calendar-month';
import { TODAY_VIEW_STORAGE_KEY, TodayPage } from './today-page';

describe('TodayPage', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function render(): Promise<HTMLElement> {
    await TestBed.configureTestingModule({ imports: [TodayPage] }).compileComponents();
    const api = TestBed.inject(TaskApi) as InMemoryTaskApi;
    await api.create('Angebot schreiben', 90, localDateKey(new Date()));
    await api.create('Ohne Schätzung', null, localDateKey(new Date()));
    await api.create('Idee', null, null);
    const fixture = TestBed.createComponent(TodayPage);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('should show the tasks, the brain dump and the capacity of today', async () => {
    const element = await render();

    expect(element.textContent).toContain('Angebot schreiben');
    expect(element.textContent).toContain('Idee');
    expect(element.textContent).toContain('1:30 h geplant von 8:00 h verfügbar');
    expect(element.textContent).toContain('Ohne Schätzung (nicht mitgezählt): 1');
  });

  it('should remember the board view', async () => {
    localStorage.setItem(TODAY_VIEW_STORAGE_KEY, 'board');
    const element = await render();

    expect(element.querySelectorAll('.board-column')).toHaveLength(3);
  });
});
