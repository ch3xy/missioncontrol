import { CalendarEvent } from '../../core/models/calendar.model';
import { Task } from '../../core/models/task.model';

const MINUTE_MS = 60_000;

/**
 * Minutes of `day` (local time) covered by timed appointments. All-day events and events without an
 * end do not block time; overlapping appointments count once; parts outside the day are cut off.
 */
export function busyMinutes(events: CalendarEvent[], day: Date): number {
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
  const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1).getTime();
  const intervals = events
    .filter((event) => !event.allDay && event.endsAt)
    .map((event) => [
      Math.max(Date.parse(event.startsAt), dayStart),
      Math.min(Date.parse(event.endsAt as string), dayEnd),
    ])
    .filter(([start, end]) => Number.isFinite(start) && Number.isFinite(end) && end > start)
    .sort((a, b) => a[0] - b[0]);

  let total = 0;
  let current: number[] | null = null;

  for (const interval of intervals) {
    if (current && interval[0] <= current[1]) {
      current[1] = Math.max(current[1], interval[1]);
    } else {
      if (current) {
        total += current[1] - current[0];
      }
      current = [...interval];
    }
  }

  if (current) {
    total += current[1] - current[0];
  }

  return Math.round(total / MINUTE_MS);
}

export interface Capacity {
  /** Daily target from the settings. */
  targetMinutes: number;
  busyMinutes: number;
  /** Target minus appointments, never below 0. */
  availableMinutes: number;
  /** Sum of the estimates of all tasks of the day. */
  plannedMinutes: number;
  /** Sum of the estimates of finished tasks. */
  doneMinutes: number;
  /** Tasks without an estimate; they are not part of the sums. */
  unestimated: number;
  overbooked: boolean;
}

export function capacity(tasks: Task[], targetHours: number, busy: number): Capacity {
  const targetMinutes = Math.round(targetHours * 60);
  const availableMinutes = Math.max(0, targetMinutes - busy);
  const estimated = tasks.filter((task) => task.estimateMinutes !== null);
  const sum = (list: Task[]) =>
    list.reduce((total, task) => total + (task.estimateMinutes ?? 0), 0);
  const plannedMinutes = sum(estimated);

  return {
    targetMinutes,
    busyMinutes: busy,
    availableMinutes,
    plannedMinutes,
    doneMinutes: sum(estimated.filter((task) => task.status === 'DONE')),
    unestimated: tasks.length - estimated.length,
    overbooked: plannedMinutes > availableMinutes,
  };
}

/** `90` → `1:30 h`, `45` → `45 min`. */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours}:${String(rest).padStart(2, '0')} h`;
}

/** Share of `whole` for a progress bar, capped at 100 %. */
export function share(part: number, whole: number): number {
  if (whole <= 0) {
    return part > 0 ? 100 : 0;
  }

  return Math.min(100, Math.round((part / whole) * 100));
}
