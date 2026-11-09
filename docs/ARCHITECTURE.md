# Architecture — Mission Control

## Overview

Mission Control is an Angular 22 dashboard. The settings are stored in a slim Spring Boot backend under `backend/` (see `docs/BACKEND.md`, decision 2026-11-09 in `.ai/decisions.md`).

It aggregates information and shortcuts from local tools without owning their data.

## Architecture Style

```text
Angular App
├── App Shell
├── Dashboard Feature
├── Calendar Feature
├── Velo Feature
├── Dash Feature
├── Shortcuts Feature
├── Settings Feature
└── Core Services
    ├── SettingsService
    ├── CalendarAdapter
    ├── VeloAdapter
    ├── DashAdapter
    └── ShortcutService
```

## Frontend-Only Principle (MVP)

Originally the MVP had no backend. Since 2026-11-09 the backend (`backend/`, `docs/BACKEND.md`) is the only store of the settings; without it the app still starts, but only with the defaults, saving disabled and a notice.

Allowed:

- Static mock data
- mission control backend (settings)
- Browser LocalStorage (UI state only)
- Opening local web apps in new tabs
- Fetching public/local JSON endpoints if CORS allows it
- User-configurable URLs

Not allowed:

- Storing API secrets in frontend code
- sevDesk API calls requiring private credentials
- OAuth flows requiring a backend
- CORS proxy inside the app

## Integration Strategy

### Velo

MVP:

- Quick link
- Mock cash-flow data
- Optional later: fetch from local JSON endpoint if Velo exposes one with CORS enabled

### Dash

MVP:

- Quick link
- Mock time tracking and customer data
- Optional later: fetch from local JSON endpoint if Dash exposes one with CORS enabled

### Calendar

MVP:

- Mock calendar data
- Optional import later:
  - ICS URL
  - Browser calendar file import
  - Local JSON source

### sevDesk

MVP:

- Shortcut only

Later:

- Direct API only if a secure backend or token proxy exists

## State

Use:

- Angular signals for UI state
- Backend for user settings, LocalStorage for UI state
- Typed adapter services for data sources

## Routing

Recommended routes:

- `/` → Dashboard
- `/calendar`
- `/velo`
- `/dash`
- `/settings`

sevDesk should open externally, not as an internal route.

## Error Handling

If an integration fails:

- Show a non-blocking widget state
- Keep dashboard usable
- Provide a settings hint

## Performance

The app should be lightweight and fast:

- No heavy charting library for MVP unless necessary
- CSS-based layout
- Simple SVG or canvas charts acceptable
