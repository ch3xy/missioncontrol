import { CalendarEvent } from '../models/calendar.model';

interface IcsEventFields {
  uid?: string;
  summary?: string;
  dtstart?: string;
  dtend?: string;
  location?: string;
  description?: string;
}

export function parseIcsEvents(icsText: string): CalendarEvent[] {
  return unfoldIcsLines(icsText)
    .reduce<IcsEventFields[]>((events, line) => {
      if (line === 'BEGIN:VEVENT') {
        events.push({});
        return events;
      }

      if (line === 'END:VEVENT') {
        return events;
      }

      const current = events.at(-1);

      if (!current) {
        return events;
      }

      const separatorIndex = line.indexOf(':');

      if (separatorIndex < 0) {
        return events;
      }

      const rawKey = line.slice(0, separatorIndex).split(';')[0]?.toUpperCase();
      const rawValue = line.slice(separatorIndex + 1);

      switch (rawKey) {
        case 'UID':
          current.uid = decodeIcsText(rawValue);
          break;
        case 'SUMMARY':
          current.summary = decodeIcsText(rawValue);
          break;
        case 'DTSTART':
          current.dtstart = rawValue;
          break;
        case 'DTEND':
          current.dtend = rawValue;
          break;
        case 'LOCATION':
          current.location = decodeIcsText(rawValue);
          break;
        case 'DESCRIPTION':
          current.description = decodeIcsText(rawValue);
          break;
      }

      return events;
    }, [])
    .map(toCalendarEvent)
    .filter((event): event is CalendarEvent => event !== null);
}

function unfoldIcsLines(icsText: string): string[] {
  return icsText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .reduce<string[]>((lines, line) => {
      if ((line.startsWith(' ') || line.startsWith('\t')) && lines.length > 0) {
        lines[lines.length - 1] += line.slice(1);
      } else {
        lines.push(line.trimEnd());
      }

      return lines;
    }, []);
}

function toCalendarEvent(fields: IcsEventFields): CalendarEvent | null {
  if (!fields.dtstart) {
    return null;
  }

  const startsAt = parseIcsDate(fields.dtstart);

  if (!startsAt) {
    return null;
  }

  const endsAt = fields.dtend ? parseIcsDate(fields.dtend) : undefined;

  return {
    id: fields.uid || `ics-${startsAt}`,
    title: fields.summary || 'Untitled event',
    startsAt,
    endsAt,
    location: fields.location,
    project: fields.description,
    source: 'ics',
  };
}

function parseIcsDate(value: string): string | undefined {
  const normalized = value.trim();
  const dateTimeMatch = normalized.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);

  if (dateTimeMatch) {
    const [, year, month, day, hour, minute, second, zulu] = dateTimeMatch;
    const iso = `${year}-${month}-${day}T${hour}:${minute}:${second}${zulu ? 'Z' : ''}`;
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
  }

  const dateMatch = normalized.match(/^(\d{4})(\d{2})(\d{2})$/);

  if (dateMatch) {
    const [, year, month, day] = dateMatch;
    return `${year}-${month}-${day}T00:00:00.000Z`;
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function decodeIcsText(value: string): string {
  return value
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim();
}
