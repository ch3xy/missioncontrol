# Codex Tasks

## Task 1 — Inspect or Bootstrap App

If an Angular app already exists, reuse it.
If not, create a new Angular 22 app.

Acceptance:
- App can be started locally
- TypeScript strict mode enabled
- Routing enabled
- Standalone components preferred
- Basic scripts available

## Task 2 — App Shell

Create the core layout.

Acceptance:
- Dark app background
- Sidebar navigation
- Header/top bar
- Main content area
- Routes for dashboard, calendar, velo, dash, settings

## Task 3 — Design Tokens

Implement global design tokens.

Acceptance:
- CSS variables for background, surface, border, text, accents
- Reusable card styling
- Responsive grid utilities

## Task 4 — Dashboard

Implement Visual 3 dashboard.

Acceptance:
- Calendar widget
- Velo cash-flow widget
- Dash time widget
- Dash customers widget
- Quick access widget
- Responsive widget grid

## Task 5 — Mock Data Layer

Implement typed mock services/adapters.

Acceptance:
- Calendar mock data
- Velo mock summary
- Dash mock summary
- No backend needed
- All data models typed

## Task 6 — Settings

Implement settings page.

Acceptance:
- Edit Velo URL
- Edit Dash URL
- Edit sevDesk URL
- Persist settings in LocalStorage
- Reset to defaults button

## Task 7 — External Shortcuts

Implement external app launch behavior.

Acceptance:
- Velo opens configured URL in new tab
- Dash opens configured URL in new tab
- sevDesk opens configured URL in new tab
- Invalid/missing URLs handled gracefully

## Task 8 — Detail Pages

Create simple internal pages.

Acceptance:
- Calendar page lists mock events
- Velo page shows finance summary and trend data
- Dash page shows time/customer summary
- Pages share visual language with dashboard

## Task 9 — Tests and Quality

Add practical tests where feasible.

Acceptance:
- App builds
- Main services tested if test setup exists
- Components do not throw
- Lint/build issues fixed

## Task 10 — Documentation

Update docs.

Acceptance:
- `docs/ASSUMPTIONS.md` created or updated
- Remaining limitations documented
- Commands run documented in final summary
