import { CalendarEvent } from '../models/calendar.model';

const today = new Date();

function at(hour: number, minute = 0): string {
  const date = new Date(today);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export const MOCK_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'cal-standup',
    title: 'Delivery Sync',
    startsAt: at(9, 30),
    endsAt: at(10),
    project: 'Platform',
    customer: 'Northstar Labs',
    source: 'mock',
  },
  {
    id: 'cal-review',
    title: 'Invoice Review',
    startsAt: at(11, 15),
    endsAt: at(12),
    project: 'Finance',
    customer: 'Internal',
    source: 'mock',
  },
  {
    id: 'cal-workshop',
    title: 'Roadmap Workshop',
    startsAt: at(14),
    endsAt: at(15, 30),
    project: 'Client Portal',
    customer: 'Helio Systems',
    location: 'Meet',
    source: 'mock',
  },
  {
    id: 'cal-focus',
    title: 'Focus Block',
    startsAt: at(16),
    endsAt: at(18),
    project: 'Mission Control',
    source: 'mock',
  },
];
