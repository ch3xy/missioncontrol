import { CalendarEvent } from '../../core/models/calendar.model';
import { eventDayKeys, localDateKey } from './calendar-month';

/** A timed event's part on one day, in minutes since local midnight, laid out next to overlaps. */
export interface TimedSegment {
  event: CalendarEvent;
  startMinute: number;
  endMinute: number;
  column: number;
  columns: number;
}

export interface WeekDay {
  /** Local date as `YYYY-MM-DD`. */
  key: string;
  date: Date;
  isToday: boolean;
  allDay: CalendarEvent[];
  timed: TimedSegment[];
}

const DAY_MINUTES = 24 * 60;
/** Short or open-ended events still get a readable block. */
const MIN_DURATION_MINUTES = 30;

export function startOfWeek(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - ((date.getDay() + 6) % 7));
}

/** Monday to Sunday of the week starting at `weekStart`. */
export function buildWeek(weekStart: Date, events: CalendarEvent[], today = new Date()): WeekDay[] {
  const todayKey = localDateKey(today);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(
      weekStart.getFullYear(),
      weekStart.getMonth(),
      weekStart.getDate() + index,
    );
    const key = localDateKey(date);

    return {
      key,
      date,
      isToday: key === todayKey,
      allDay: events.filter((event) => event.allDay && eventDayKeys(event).includes(key)),
      timed: layoutDay(timedSegments(date, events)),
    };
  });
}

function timedSegments(
  date: Date,
  events: CalendarEvent[],
): Omit<TimedSegment, 'column' | 'columns'>[] {
  const dayStart = date.getTime();
  const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).getTime();
  const segments: Omit<TimedSegment, 'column' | 'columns'>[] = [];

  for (const event of events) {
    if (event.allDay) {
      continue;
    }

    const start = Date.parse(event.startsAt);
    const end = event.endsAt ? Date.parse(event.endsAt) : start;

    // Events without duration belong to the day they start on
    if (start >= dayEnd || (end > start ? end <= dayStart : start < dayStart)) {
      continue;
    }

    const startMinute = start <= dayStart ? 0 : minuteOfDay(new Date(start));
    const endMinute = end >= dayEnd ? DAY_MINUTES : minuteOfDay(new Date(end));
    segments.push({
      event,
      startMinute,
      endMinute: Math.min(DAY_MINUTES, Math.max(endMinute, startMinute + MIN_DURATION_MINUTES)),
    });
  }

  return segments;
}

/** Wall-clock minutes, so a 09:00 event sits at 09:00 also on daylight saving days. */
function minuteOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

/** Overlapping events share the day width: each cluster gets as many columns as it needs. */
function layoutDay(segments: Omit<TimedSegment, 'column' | 'columns'>[]): TimedSegment[] {
  const sorted = [...segments].sort(
    (a, b) => a.startMinute - b.startMinute || b.endMinute - a.endMinute,
  );
  const result: TimedSegment[] = [];
  let cluster: TimedSegment[] = [];
  let columnEnds: number[] = [];
  let clusterEnd = -1;

  const closeCluster = () => {
    for (const segment of cluster) {
      segment.columns = columnEnds.length;
    }
    cluster = [];
    columnEnds = [];
  };

  for (const segment of sorted) {
    if (segment.startMinute >= clusterEnd) {
      closeCluster();
    }

    let column = columnEnds.findIndex((end) => end <= segment.startMinute);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(segment.endMinute);
    } else {
      columnEnds[column] = segment.endMinute;
    }

    const laidOut = { ...segment, column, columns: 1 };
    cluster.push(laidOut);
    result.push(laidOut);
    clusterEnd = Math.max(clusterEnd, segment.endMinute);
  }

  closeCluster();
  return result;
}
