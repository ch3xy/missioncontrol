import { Injectable } from '@angular/core';
import { Task, TaskStatus, isTask, isTaskList } from '../models/task.model';
import { BackendResult, backendRequest } from './backend-request';

export type TaskApiResult<T> =
  | { kind: 'ok'; data: T }
  | Exclude<BackendResult, { kind: 'ok' }>
  /** The backend answered 2xx with something that is not the expected shape. */
  | { kind: 'invalid-shape' };

export interface TaskChanges {
  title: string;
  estimateMinutes: number | null;
  status: TaskStatus;
  /** Version the change is based on. */
  version: number;
}

/** HTTP access to `/api/v1/tasks` (daily plan) of the mission control backend. */
@Injectable({ providedIn: 'root' })
export class TaskApi {
  /** Tasks of a day (`YYYY-MM-DD`), or of the brain dump for `null`. */
  list(planDate: string | null): Promise<TaskApiResult<Task[]>> {
    const query = planDate !== null ? `?date=${encodeURIComponent(planDate)}` : '';
    return this.request(`tasks${query}`, { cache: 'no-store' }, isTaskList);
  }

  carryOver(date: string): Promise<TaskApiResult<Task[]>> {
    return this.request(
      `tasks/carry-over?date=${encodeURIComponent(date)}`,
      { cache: 'no-store' },
      isTaskList,
    );
  }

  create(
    title: string,
    estimateMinutes: number | null,
    planDate: string | null,
  ): Promise<TaskApiResult<Task>> {
    return this.request(
      'tasks',
      { method: 'POST', body: JSON.stringify({ title, estimateMinutes, planDate }) },
      isTask,
    );
  }

  update(id: string, changes: TaskChanges): Promise<TaskApiResult<Task>> {
    return this.request(
      `tasks/${encodeURIComponent(id)}`,
      { method: 'PUT', body: JSON.stringify(changes) },
      isTask,
    );
  }

  /** `version` as for update; 409 when the task changed in the meantime. */
  delete(id: string, version: number): Promise<TaskApiResult<null>> {
    return this.request(
      `tasks/${encodeURIComponent(id)}?version=${version}`,
      { method: 'DELETE' },
      (value): value is null => value === null,
    );
  }

  /** To the end of a day, or to the brain dump for `null`. */
  move(ids: string[], planDate: string | null): Promise<TaskApiResult<Task[]>> {
    return this.request(
      'tasks/move',
      { method: 'POST', body: JSON.stringify({ ids, planDate, backlog: planDate === null }) },
      isTaskList,
    );
  }

  /** `ids` must be all tasks of that day or of the brain dump, in the new order. */
  reorder(planDate: string | null, ids: string[]): Promise<TaskApiResult<Task[]>> {
    return this.request(
      'tasks/order',
      { method: 'PUT', body: JSON.stringify({ planDate, ids, backlog: planDate === null }) },
      isTaskList,
    );
  }

  private async request<T>(
    path: string,
    init: RequestInit,
    isValid: (value: unknown) => value is T,
  ): Promise<TaskApiResult<T>> {
    const result = await backendRequest(path, init);

    if (result.kind !== 'ok') {
      return result;
    }

    return isValid(result.payload)
      ? { kind: 'ok', data: result.payload }
      : { kind: 'invalid-shape' };
  }
}
