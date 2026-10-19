# Mission Control

Mission Control is a local-first Angular 22 dashboard for a freelance software developer.

It is intentionally frontend-only for the MVP. There is no backend, authentication, OAuth flow, cloud sync, or secret storage.

## Features

- App shell in the shared Arrow product design (velo/dash): collapsible sidebar, compact top bar, light/dark/system theme
- German UI by default (de-AT date and number formats), switchable to English in Settings
- Dashboard widgets for Calendar, Velo cash flow, Dash time tracking, Dash customers, and Quick Access
- Detail pages for Calendar, Velo, and Dash
- Configurable external app URLs for Velo, Dash, and sevDesk
- Optional local tool shortcuts
- LocalStorage-backed settings with export/import backup
- Live data from the velo and dash REST APIs (read-only)
- Optional browser-readable local JSON sources for Calendar, Velo, and Dash
- Basic browser-readable ICS calendar source support
- Notices when a source is not configured, and warnings when it is unreachable or invalid (no mock data)
- Bundled JSON and ICS examples in `public/examples/`

## Requirements

Use Node.js 26.

The repository pins Node `26.3.1` in `.nvmrc` and declares Node/npm engines in `package.json`.

```bash
nvm use
npm install
```

## Development

```bash
npm run start
```

Open:

```text
http://localhost:4200
```

### Live data from velo and dash

Settings → **Live-Daten (API)** takes the address of each app (for example `https://arrow.local/velo`); mission control then reads `/api/...` below it. **APIs dieses Servers verwenden** fills in `<origin>/velo` and `<origin>/dash`, which matches the Caddy setup on the server.

The dev server proxies `/velo/api` and `/dash/api` the same way (`proxy.conf.mjs`), so no CORS configuration is needed in velo or dash. Point it at the running backends:

```bash
VELO_API_TARGET=http://localhost:8081 DASH_API_TARGET=http://localhost:8080 npm run start
```

Defaults are `http://localhost:8081` (velo) and `http://localhost:8080` (dash). Details: [docs/LOCAL_JSON_CONTRACTS.md](docs/LOCAL_JSON_CONTRACTS.md#velo-and-dash-rest-apis).

## Quality Checks

```bash
npm run lint
npm run test -- --watch=false
npm run build
```

`npm run lint` currently combines TypeScript type checks and Prettier formatting checks.

## Local Source Examples

When the dev server is running, Settings can use these bundled examples:

```text
http://localhost:4200/examples/calendar.json
http://localhost:4200/examples/calendar.ics
http://localhost:4200/examples/velo.json
http://localhost:4200/examples/dash.json
```

Settings also includes preset buttons for these examples.

The expected JSON/ICS shapes are documented in [docs/LOCAL_JSON_CONTRACTS.md](docs/LOCAL_JSON_CONTRACTS.md).

## Default External URLs

- Velo: `http://localhost:4201`
- Dash: `http://localhost:4202`
- sevDesk: `https://my.sevdesk.de`

These values are configurable in Settings.

## MVP Boundaries

- sevDesk is an external shortcut only.
- There is no built-in mock data: without a configured, reachable source a card shows a notice instead of numbers.
- ICS support covers basic `VEVENT` parsing and does not yet handle recurrence rules or advanced timezone behavior.
- No secrets, tokens, API keys, or private URLs should be committed.
