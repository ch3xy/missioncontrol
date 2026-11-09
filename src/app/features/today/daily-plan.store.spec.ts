import { TestBed } from '@angular/core/testing';
import { TaskApi } from '../../core/services/task-api';
import { InMemoryTaskApi } from '../../testing/in-memory-task-api';
import { DailyPlanStore } from './daily-plan.store';

describe('DailyPlanStore', () => {
  const today = '2026-11-09';

  function setup(): { store: DailyPlanStore; api: InMemoryTaskApi } {
    TestBed.configureTestingModule({ providers: [DailyPlanStore] });
    return {
      store: TestBed.inject(DailyPlanStore),
      api: TestBed.inject(TaskApi) as InMemoryTaskApi,
    };
  }

  it('should load the day, the brain dump and the carry-over', async () => {
    const { store, api } = setup();
    await api.create('Gestern offen', 30, '2026-11-08');
    await api.create('Heute', null, today);
    await api.create('Irgendwann', null, null);

    await store.load(today);

    expect(store.status()).toBe('ready');
    expect(store.tasks().map((task) => task.title)).toEqual(['Heute']);
    expect(store.backlog().map((task) => task.title)).toEqual(['Irgendwann']);
    expect(store.carryOver().map((task) => task.title)).toEqual(['Gestern offen']);
  });

  it('should add tasks to the day and to the brain dump', async () => {
    const { store } = setup();
    await store.load(today);

    expect(await store.add('  Angebot schreiben ', 60)).toBe(true);
    expect(await store.add('Idee', null, true)).toBe(true);

    expect(store.tasks()).toEqual([
      expect.objectContaining({ title: 'Angebot schreiben', estimateMinutes: 60, planDate: today }),
    ]);
    expect(store.backlog()).toEqual([expect.objectContaining({ title: 'Idee', planDate: null })]);
  });

  it('should take over carry-over tasks and move tasks to the brain dump', async () => {
    const { store, api } = setup();
    const old = await api.create('Alt', 30, '2026-11-07');
    await store.load(today);

    await store.planToday(store.carryOver().map((task) => task.id));

    expect(store.carryOver()).toEqual([]);
    expect(store.tasks().map((task) => task.title)).toEqual(['Alt']);

    await store.toBacklog([old.kind === 'ok' ? old.data.id : '']);

    expect(store.tasks()).toEqual([]);
    expect(store.backlog().map((task) => task.title)).toEqual(['Alt']);
  });

  it('should change the status and reorder within the day', async () => {
    const { store } = setup();
    await store.load(today);
    await store.add('A', null);
    await store.add('B', null);

    await store.setStatus(store.tasks()[0], 'DONE');
    await store.shift(store.tasks()[1], -1);

    expect(store.tasks().map((task) => [task.title, task.status])).toEqual([
      ['B', 'OPEN'],
      ['A', 'DONE'],
    ]);
    expect(await store.shift(store.tasks()[0], -1)).toBe(false);
  });

  it('should move long lists in batches the backend accepts', async () => {
    const { store, api } = setup();
    for (let index = 0; index < 501; index++) {
      await api.create(`Alt ${index}`, null, '2026-11-08');
    }
    await store.load(today);
    const move = vi.spyOn(api, 'move');

    expect(await store.planToday(store.carryOver().map((task) => task.id))).toBe(true);

    expect(move.mock.calls.map(([ids]) => ids.length)).toEqual([500, 1]);
    expect(store.tasks()).toHaveLength(501);
  });

  it('should keep the version when reordering, so an open edit still saves', async () => {
    const { store } = setup();
    await store.load(today);
    await store.add('A', null);
    await store.add('B', null);
    const editing = store.tasks()[1];

    await store.shift(editing, -1);

    expect(await store.edit(editing, 'B neu', null)).toBe(true);
    expect(store.tasks()[0].title).toBe('B neu');
  });

  it('should report errors and reload the stored state', async () => {
    const { store, api } = setup();
    await store.load(today);
    await store.add('A', null);
    const task = store.tasks()[0];
    api.tasks = [];

    expect(await store.setStatus(task, 'DONE')).toBe(false);

    expect(store.error()).toEqual({ key: 'today.error.conflict' });
    expect(store.tasks()).toEqual([]);
  });

  it('should refuse an update based on an outdated version', async () => {
    const { store, api } = setup();
    await store.load(today);
    await store.add('A', null);
    const seen = store.tasks()[0];
    // Another device changes the task in between
    await api.update(seen.id, { ...seen, title: 'Anderes Gerät', version: seen.version });

    expect(await store.edit(seen, 'Dieses Gerät', null)).toBe(false);

    expect(store.error()).toEqual({ key: 'today.error.conflict' });
    expect(store.tasks()[0].title).toBe('Anderes Gerät');
  });

  it('should be unavailable without backend and refuse changes', async () => {
    const { store, api } = setup();
    api.available = false;

    await store.load(today);

    expect(store.status()).toBe('unavailable');
    expect(store.editable()).toBe(false);
    expect(await store.add('A', null)).toBe(false);
  });
});
