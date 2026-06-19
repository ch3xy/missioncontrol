# MVP Status

## Current State

Mission Control is a runnable frontend-only Angular 22 MVP.

Implemented:
- Visual 3 app shell with dark sidebar, compact header, and responsive widget grid
- Dashboard widgets for Calendar, Velo, Dash time, Dash customers, and Quick Access
- Detail pages for Calendar, Velo, and Dash
- Settings page with LocalStorage persistence and reset to defaults
- Configurable Velo, Dash, and sevDesk launch URLs
- Two optional configurable local tool shortcuts
- Typed mock adapters for Calendar, Velo, and Dash
- Optional local JSON source placeholders with validation and mock fallback
- Source badges showing whether data comes from mock or local JSON sources
- Unit tests for app bootstrapping, settings, shortcuts, validators, source badges, and local JSON adapters

## Runtime

Use Node.js 26.

The repository pins Node `26.3.1` in `.nvmrc` and declares Node/npm engines in `package.json`.

## Verified Commands

The following commands pass with Node 26:

```bash
npm run test -- --watch=false
npm run build
```

Additional type checks used during implementation:

```bash
./node_modules/.bin/tsc -p tsconfig.app.json --noEmit
./node_modules/.bin/tsc -p tsconfig.spec.json --noEmit
```

## MVP Boundaries

Still intentionally placeholder-only:
- sevDesk remains an external shortcut only
- Velo and Dash use mock data unless a local JSON URL is configured and CORS allows access
- ICS import is represented in Settings but not implemented as a parser yet
- No backend, authentication, cloud sync, OAuth, or secret storage is included

## Next Useful Improvements

- Add import adapters for ICS and stable local JSON schemas
- Add richer calendar grouping and empty-state copy
- Add visual regression checks once a browser automation setup is part of the project scripts
- Add optional user-configurable quick access tiles
- Expand the two local tool slots into a full shortcut editor if more links are needed
