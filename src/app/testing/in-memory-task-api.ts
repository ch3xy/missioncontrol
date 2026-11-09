import { Injectable } from '@angular/core';
import { Task } from '../core/models/task.model';
import { TaskApi, TaskApiResult, TaskChanges } from '../core/services/task-api';

/** Unit tests only: answers like the task API of the backend, from memory. */
@Injectable()
export class InMemoryTaskApi extends TaskApi {
  tasks: Task[] = [];
  available = true;
  private nextId = 1;

  override async list(planDate: string | null): Promise<TaskApiResult<Task[]>> {
    return this.answer(() => this.ofDay(planDate));
  }

  override async carryOver(date: string): Promise<TaskApiResult<Task[]>> {
    return this.answer(() =>
      this.tasks
        .filter((task) => task.planDate !== null && task.planDate < date && task.status !== 'DONE')
        .sort(
          (a, b) =>
            (a.planDate as string).localeCompare(b.planDate as string) || a.position - b.position,
        ),
    );
  }

  override async create(
    title: string,
    estimateMinutes: number | null,
    planDate: string | null,
  ): Promise<TaskApiResult<Task>> {
    return this.answer(() => {
      const task: Task = {
        id: `task-${this.nextId++}`,
        title,
        estimateMinutes,
        status: 'OPEN',
        planDate,
        position: this.ofDay(planDate).length,
        doneAt: null,
        version: 0,
      };
      this.tasks.push(task);
      return task;
    });
  }

  override async update(id: string, changes: TaskChanges): Promise<TaskApiResult<Task>> {
    if (!this.available) {
      return { kind: 'unavailable' };
    }

    const task = this.tasks.find((candidate) => candidate.id === id);

    if (!task) {
      return { kind: 'not-found' };
    }

    if (task.version !== changes.version) {
      return { kind: 'conflict', detail: 'version' };
    }

    return this.answer(() =>
      Object.assign(task, {
        title: changes.title,
        estimateMinutes: changes.estimateMinutes,
        status: changes.status,
        version: task.version + 1,
      }),
    );
  }

  override async delete(id: string, version: number): Promise<TaskApiResult<null>> {
    const task = this.tasks.find((candidate) => candidate.id === id);

    if (this.available && task && task.version !== version) {
      return { kind: 'conflict', detail: 'version' };
    }

    return this.answer(() => {
      this.tasks = this.tasks.filter((task) => task.id !== id);
      return null;
    });
  }

  override async move(ids: string[], planDate: string | null): Promise<TaskApiResult<Task[]>> {
    return this.answer(() => {
      let position = this.ofDay(planDate).length;
      return ids.map((id) => {
        const task = this.tasks.find((candidate) => candidate.id === id) as Task;
        if (task.planDate !== planDate) {
          Object.assign(task, { planDate, position: position++, version: task.version + 1 });
        }
        return task;
      });
    });
  }

  override async reorder(planDate: string | null, ids: string[]): Promise<TaskApiResult<Task[]>> {
    if (!this.available) {
      return { kind: 'unavailable' };
    }

    const day = this.ofDay(planDate);

    if (day.length !== ids.length || day.some((task) => !ids.includes(task.id))) {
      return { kind: 'conflict', detail: 'changed' };
    }

    return this.answer(() => {
      ids.forEach((id, position) => {
        const task = this.tasks.find((candidate) => candidate.id === id) as Task;
        // Like the backend: the order is not content and keeps the version
        Object.assign(task, { position });
      });
      return this.ofDay(planDate);
    });
  }

  private ofDay(planDate: string | null): Task[] {
    return this.tasks
      .filter((task) => task.planDate === planDate)
      .sort((a, b) => a.position - b.position)
      .map((task) => ({ ...task }));
  }

  private answer<T>(data: () => T): TaskApiResult<T> {
    return this.available ? { kind: 'ok', data: data() } : { kind: 'unavailable' };
  }
}
