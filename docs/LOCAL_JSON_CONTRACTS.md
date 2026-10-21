# Local JSON Contracts

Mission Control can read optional local JSON files or endpoints for Calendar, Velo, and Dash.

These sources are configured in Settings. If a URL is empty, unreachable, blocked by CORS, or returns a shape that does not match the contract, Mission Control keeps working: the card shows a notice (not configured) or a warning (unreachable, invalid) and no data. There is no built-in mock data.

Calendar can also read a basic ICS URL when the Calendar source is set to `ICS URL`.

The calendar source URL field takes one URL per line: an absolute http(s) URL or a path on the same host starting with `/` (e.g. `/missioncontrol/calendars/work.ics`). All sources are loaded in parallel and their events are merged; an event with the same `id` and `startsAt` in several sources is shown once. If only some sources fail, the loaded events are shown together with a warning. Private iCloud calendars: [ICLOUD_CALENDAR.md](ICLOUD_CALENDAR.md).

## Example URLs

When running the Angular dev server, the included examples are available at:

```text
http://127.0.0.1:4200/examples/calendar.json
http://127.0.0.1:4200/examples/calendar.ics
http://127.0.0.1:4200/examples/velo.json
http://127.0.0.1:4200/examples/dash.json
```

## Calendar

Calendar expects an array of events.

Required fields:

- `id`: string
- `title`: string
- `startsAt`: ISO date-time string
- `source`: `ics` or `local-json`

Optional fields:

- `endsAt`: ISO date-time string
- `project`: string
- `customer`: string
- `location`: string
- `calendar`: string, name of the calendar, shown next to the appointment
- `color`: string, calendar color as a CSS color (e.g. `#1badf8`)
- `allDay`: boolean, all-day event; `startsAt` is 00:00 UTC of its date and shown as "Ganztägig" instead of a time

See `public/examples/calendar.json`.

## Calendar ICS

The ICS adapter supports basic `VEVENT` parsing.

Used fields:

- `UID` maps to `id`
- `SUMMARY` maps to `title`
- `DTSTART` maps to `startsAt`
- `DTEND` maps to `endsAt`
- `LOCATION` maps to `location`
- `DESCRIPTION` maps to `project`
- Calendar-level `X-WR-CALNAME` (or RFC 7986 `NAME`) maps to `calendar` of every event
- Calendar-level `X-APPLE-CALENDAR-COLOR` (or RFC 7986 `COLOR`) maps to `color`; Apple's `#RRGGBBAA` becomes `#rrggbb`, values that are neither hex nor a color keyword are dropped

Parsing uses [ical.js](https://github.com/kewisch/ical.js). Supported date formats:

- UTC date-time, for example `20260619T090000Z`
- Local date-time with `TZID`, converted with the calendar's `VTIMEZONE`; without one, or without `TZID` (floating time), in the browser's time zone
- Date-only values (`VALUE=DATE`), for example `20260619`, stored as 00:00 UTC of that day with `allDay: true`

Recurring events (`RRULE`, `RDATE`) are expanded into one event per occurrence from today up to one year ahead; `EXDATE` and changed occurrences (`RECURRENCE-ID`) are applied. All occurrences keep the event's `UID` as `id`. Non-recurring events are not limited to that range.

A response without `BEGIN:VCALENDAR` (e.g. an HTML page) or one ical.js cannot parse is reported as invalid; a calendar without events, or an empty response (vdirsyncer writes empty files for empty calendars), is valid and simply empty.

See `public/examples/calendar.ics`.

## Velo

Velo expects one summary object.

Required fields:

- `currentCashFlow`: number
- `forecastCashFlow`: number
- `currency`: `EUR`
- `periodLabel`: string
- `source`: `local-json`
- `trend`: array of `{ "date": string, "value": number }`

See `public/examples/velo.json`.

## Dash

Dash expects one summary object.

Required fields:

- `trackedTodayMinutes`: number
- `targetTodayMinutes`: number
- `activeCustomers`: number
- `openProjects`: number
- `source`: `local-json`

See `public/examples/dash.json`.

## Velo and Dash REST APIs

Instead of a JSON file, mission control can read the existing REST APIs of velo and dash directly (Settings → Live-Daten (API)). The configured value is the app's base URL, for example `https://arrow.local/velo`. An API URL takes precedence over the local JSON URL; if the API fails, the card shows a warning and no data.

Velo (all accounts in EUR are summed; other currencies are skipped):

- `GET {base}/api/accounts` → `currentBalance` per account becomes `currentCashFlow`
- `GET {base}/api/accounts/{id}/forecast?horizon=30` → `dailyBalances` summed per day become `trend`; the last day is `forecastCashFlow`

Dash:

- `GET {base}/api/v1/dashboard` → `today.durationSeconds` becomes `trackedTodayMinutes`
- `GET {base}/api/v1/clients` → non-archived clients become `activeCustomers`
- `GET {base}/api/v1/projects?status=ACTIVE` → count becomes `openProjects`
- `targetTodayMinutes` comes from mission control's setting "Tagesziel" (default 8 h), because dash has no daily target.

Only the fields listed here are validated; additional fields in the responses are ignored.

## CORS

On the server, velo, dash and mission control share one host behind Caddy, so API requests are same-origin and need no CORS. The dev server achieves the same through `proxy.conf.mjs`.

If JSON is served from another local app or port, that app must allow browser requests from the Mission Control origin.

For local development this usually means allowing:

```text
http://127.0.0.1:4200
http://localhost:4200
```
