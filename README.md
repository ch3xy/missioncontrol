# Mission Control

Mission Control is a local-first Angular 22 dashboard for a freelance software developer.

It is intentionally frontend-only for the MVP. There is no backend, authentication, OAuth flow, cloud sync, or secret storage.

## Features

- Dark Visual 3 app shell with left sidebar and compact top bar
- Dashboard widgets for Calendar, Velo cash flow, Dash time tracking, Dash customers, and Quick Access
- Detail pages for Calendar, Velo, and Dash
- Configurable external app URLs for Velo, Dash, and sevDesk
- Optional local tool shortcuts
- LocalStorage-backed settings with export/import backup
- Mock data adapters for all data widgets
- Optional browser-readable local JSON sources for Calendar, Velo, and Dash
- Basic browser-readable ICS calendar source support
- Fallback notices when configured sources are missing or invalid
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
- Velo and Dash use mock data unless local JSON URLs are configured and readable by the browser.
- ICS support covers basic `VEVENT` parsing and does not yet handle recurrence rules or advanced timezone behavior.
- No secrets, tokens, API keys, or private URLs should be committed.
