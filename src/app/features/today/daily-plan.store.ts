import { Injectable, computed, inject, signal } from '@angular/core';
import { TranslationKey } from '../../core/i18n/translations';
import { Task, TaskStatus } from '../../core/models/task.model';
import { TaskApi, TaskApiResult } from '../../core/services/task-api';

/** Same as the `@Size(max = 500)` of `MoveTasksRequest` in the backend. */
const MOVE_BATCH = 500;

export type PlanStatus = 'loading' | 'ready' | 'unavailable';

export interface PlanError {
  key: TranslationKey;
  detail?: string;
}

/**
 * State of the daily plan for one day: its tasks, the brain dump and the carry-over suggestions.
 * Every change goes to the backend first and then reloads all three lists, so the view always shows
 * the stored state (also when another device changed something in between).
 */
@Injectable()
export class DailyPlanStore {
  private readonly api = inject(TaskApi);
  /** Only the latest load may set the lists; an older answer arriving late is outdated. */
  private generation = 0;

  private readonly dateState = signal<string | null>(null);
  private readonly tasksState = signal<Task[]>([]);
  private readonly backlogState = signal<Task[]>([]);
  private readonly carryOverState = signal<Task[]>([]);
  private readonly statusState = signal<PlanStatus>('loading');
  private readonly busyState = signal(false);
  private readonly errorState = signal<PlanError | null>(null);

  readonly date = this.dateState.asReadonly();
  readonly tasks = this.tasksState.asReadonly();
  readonly backlog = this.backlogState.asReadonly();
  readonly carryOver = this.carryOverState.asReadonly();
  readonly status = this.statusState.asReadonly();
  /** A change is being saved; actions are disabled meanwhile. */
  readonly busy = this.busyState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly editable = computed(() => this.statusState() === 'ready' && !this.busyState());

  /** Loads the plan of `date` (`YYYY-MM-DD`). */
  async load(date: string): Promise<void> {
    const generation = ++this.generation;

    // Another day (e.g. after midnight): the lists of the old day must not stay editable meanwhile
    if (date !== this.dateState() || this.statusState() !== 'ready') {
      this.statusState.set('loading');
      this.tasksState.set([]);
      this.carryOverState.set([]);
    }

    this.dateState.set(date);

    const [tasks, backlog, carryOver] = await Promise.all([
      this.api.list(date),
      this.api.list(null),
      this.api.carryOver(date),
    ]);

    if (generation !== this.generation) {
      return;
    }

    if (tasks.kind === 'ok' && backlog.kind === 'ok' && carryOver.kind === 'ok') {
      this.tasksState.set(tasks.data);
      this.backlogState.set(backlog.data);
      this.carryOverState.set(carryOver.data);
      this.statusState.set('ready');
    } else {
      // Do not offer outdated suggestions next to the notice; the lists stay visible but locked
      this.carryOverState.set([]);
      this.statusState.set('unavailable');
    }
  }

  reload(): Promise<void> {
    const date = this.dateState();
    return date ? this.load(date) : Promise.resolve();
  }

  clearError(): void {
    this.errorState.set(null);
  }

  /** New task at the end of the day, or in the brain dump for `toBacklog`. */
  add(title: string, estimateMinutes: number | null, toBacklog = false): Promise<boolean> {
    return this.change(() =>
      this.api.create(title.trim(), estimateMinutes, toBacklog ? null : this.dateState()),
    );
  }

  setStatus(task: Task, status: TaskStatus): Promise<boolean> {
    return this.change(() =>
      this.api.update(task.id, {
        title: task.title,
        estimateMinutes: task.estimateMinutes,
        status,
        version: task.version,
      }),
    );
  }

  edit(task: Task, title: string, estimateMinutes: number | null): Promise<boolean> {
    return this.change(() =>
      this.api.update(task.id, {
        title: title.trim(),
        estimateMinutes,
        status: task.status,
        version: task.version,
      }),
    );
  }

  remove(task: Task): Promise<boolean> {
    return this.change(() => this.api.delete(task.id, task.version));
  }

  /** Plans tasks (from the brain dump or earlier days) for the current day. */
  planToday(ids: string[]): Promise<boolean> {
    return this.change(() => this.moveInBatches(ids, this.dateState()));
  }

  toBacklog(ids: string[]): Promise<boolean> {
    return this.change(() => this.moveInBatches(ids, null));
  }

  /** Moves a task one place up (`-1`) or down (`1`) within its day or the brain dump. */
  shift(task: Task, offset: -1 | 1): Promise<boolean> {
    const list = task.planDate === null ? this.backlogState() : this.tasksState();
    const index = list.findIndex((candidate) => candidate.id === task.id);
    const target = index + offset;

    if (index < 0 || target < 0 || target >= list.length) {
      return Promise.resolve(false);
    }

    const ids = list.map((candidate) => candidate.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    return this.change(() => this.api.reorder(task.planDate, ids));
  }

  /** The backend accepts at most MOVE_BATCH ids per request (e.g. a long carry-over list). */
  private async moveInBatches(
    ids: string[],
    planDate: string | null,
  ): Promise<TaskApiResult<unknown>> {
    let result: TaskApiResult<unknown> = { kind: 'ok', data: [] };

    for (let start = 0; start < ids.length && result.kind === 'ok'; start += MOVE_BATCH) {
      result = await this.api.move(ids.slice(start, start + MOVE_BATCH), planDate);
    }

    return result;
  }

  private async change(action: () => Promise<TaskApiResult<unknown>>): Promise<boolean> {
    if (!this.editable()) {
      return false;
    }

    this.busyState.set(true);
    this.errorState.set(null);
    const result = await action();
    this.errorState.set(planError(result));
    // Also after a failure: the stored state may differ from what the view shows
    await this.reload();
    this.busyState.set(false);
    return result.kind === 'ok';
  }
}

function planError(result: TaskApiResult<unknown>): PlanError | null {
  switch (result.kind) {
    case 'ok':
      return null;
    case 'invalid':
      return { key: 'today.error.invalid', detail: result.detail || '–' };
    case 'conflict':
    case 'not-found':
      return { key: 'today.error.conflict' };
    case 'forbidden':
      return { key: 'today.error.forbidden' };
    default:
      return { key: 'today.error.unavailable' };
  }
}
