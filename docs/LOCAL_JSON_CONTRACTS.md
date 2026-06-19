# Local JSON Contracts

Mission Control can read optional local JSON files or endpoints for Calendar, Velo, and Dash.

These sources are configured in Settings. If a URL is empty, unreachable, blocked by CORS, or returns a shape that does not match the contract, Mission Control keeps working and falls back to built-in mock data.

## Example URLs

When running the Angular dev server, the included examples are available at:

```text
http://127.0.0.1:4200/examples/calendar.json
http://127.0.0.1:4200/examples/velo.json
http://127.0.0.1:4200/examples/dash.json
```

## Calendar

Calendar expects an array of events.

Required fields:

- `id`: string
- `title`: string
- `startsAt`: ISO date-time string
- `source`: `mock`, `ics`, or `local-json`

Optional fields:

- `endsAt`: ISO date-time string
- `project`: string
- `customer`: string
- `location`: string

See `public/examples/calendar.json`.

## Velo

Velo expects one summary object.

Required fields:

- `currentCashFlow`: number
- `forecastCashFlow`: number
- `currency`: `EUR`
- `periodLabel`: string
- `source`: `mock` or `local-json`
- `trend`: array of `{ "date": string, "value": number }`

See `public/examples/velo.json`.

## Dash

Dash expects one summary object.

Required fields:

- `trackedTodayMinutes`: number
- `targetTodayMinutes`: number
- `activeCustomers`: number
- `openProjects`: number
- `source`: `mock` or `local-json`

See `public/examples/dash.json`.

## CORS

If JSON is served from another local app or port, that app must allow browser requests from the Mission Control origin.

For local development this usually means allowing:

```text
http://127.0.0.1:4200
http://localhost:4200
```
