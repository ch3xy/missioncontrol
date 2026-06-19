# Architecture — Mission Control

## Overview

Mission Control is a frontend-only Angular 22 dashboard.

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

## Frontend-Only Principle

The MVP must not require a backend.

Allowed:

- Static mock data
- Browser LocalStorage
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
- LocalStorage for user settings
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
