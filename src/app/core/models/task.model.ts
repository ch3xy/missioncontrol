/** Same values as `TaskStatus` in the backend. */
export const TASK_STATUSES = ['OPEN', 'IN_PROGRESS', 'DONE'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export interface Task {
  id: string;
  title: string;
  /** Optional; tasks without an estimate do not count towards the capacity. */
  estimateMinutes: number | null;
  status: TaskStatus;
  /** Local day `YYYY-MM-DD`; `null` = brain dump. */
  planDate: string | null;
  position: number;
  doneAt: string | null;
  /** Sent back on update; a newer version in the backend means another device changed the task (409). */
  version: number;
}

/** Choices of the estimate picker, in minutes. */
export const ESTIMATE_OPTIONS = [15, 30, 45, 60, 90, 120, 180, 240] as const;

export function isTask(value: unknown): value is Task {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const task = value as Record<string, unknown>;
  return (
    typeof task['id'] === 'string' &&
    typeof task['title'] === 'string' &&
    (task['estimateMinutes'] === null || typeof task['estimateMinutes'] === 'number') &&
    TASK_STATUSES.some((status) => status === task['status']) &&
    (task['planDate'] === null || typeof task['planDate'] === 'string') &&
    typeof task['position'] === 'number' &&
    (task['doneAt'] === null || typeof task['doneAt'] === 'string') &&
    typeof task['version'] === 'number'
  );
}

export function isTaskList(value: unknown): value is Task[] {
  return Array.isArray(value) && value.every(isTask);
}
