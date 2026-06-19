# AGENTS.md — Mission Control

## Project

Mission Control is a local-first Angular 22 dashboard for a freelance software developer.

It provides a central overview for:
- Calendar and upcoming appointments
- Velo: cash flow, forecasts, finance overview
- Dash: time tracking, customers, project management
- sevDesk shortcut
- Local quick access to tools running in the local network

The app should be implemented as a frontend-only Angular application for the MVP.

## Primary Goal

Build as much of the project as possible autonomously.

Do not ask the user for approval after every step.
Make sensible implementation decisions based on this documentation.
Prefer a complete, working MVP over waiting for perfect information.

## Tech Stack

- Angular 22
- TypeScript strict mode
- Standalone components
- Angular signals for local state
- Angular routing
- Reactive forms or signal forms where appropriate
- SCSS or CSS, no heavy UI framework unless already present
- LocalStorage for settings
- Optional IndexedDB only if needed later
- No backend for MVP

## Non-Goals for MVP

Do not implement:
- A custom backend
- Server-side OAuth
- Secret storage in frontend code
- Direct sevDesk API integration with private API keys
- Authentication
- Multi-user support
- Cloud sync
- Electron/native packaging

## Autonomy Rules

Codex should:
1. Inspect the repository first.
2. Reuse existing structure if one exists.
3. Create missing files and folders as needed.
4. Implement incrementally.
5. Run available checks after meaningful changes.
6. Fix errors it introduced.
7. Avoid asking for permission unless blocked by missing credentials, destructive actions, or impossible requirements.
8. Use mock data when real integrations are unavailable.
9. Keep all changes frontend-only.
10. Document assumptions in `docs/ASSUMPTIONS.md`.

## Safety and Boundaries

Never commit secrets, API keys, tokens, passwords, or private URLs.
Use configurable local URLs instead.

If a local app URL is needed, default to:
- Velo: `http://localhost:4201`
- Dash: `http://localhost:4202`
- sevDesk: `https://my.sevdesk.de`

These values must be configurable in Settings.

## Implementation Priorities

Priority order:
1. Working Angular app
2. App shell and routing
3. Visual 3 dashboard layout
4. Mock data adapters
5. Settings for external app URLs
6. Calendar widget
7. Velo widget
8. Dash widget
9. Quick access tiles
10. Responsive polish
11. Tests and documentation

## UI Direction

Use Visual 3:
- Dark theme
- Left icon sidebar
- Compact top bar
- Dashboard widget grid
- Cards with subtle borders
- Blue, green, red accent colors
- Desktop-first, tablet-friendly
- Minimal visual noise

## Commands

Prefer these commands if available:

```bash
npm install
npm run start
npm run build
npm run test
npm run lint
```

If scripts are missing, add sensible defaults.

## Coding Standards

- Use strict TypeScript.
- Avoid `any`.
- Prefer typed interfaces.
- Keep components small.
- Use standalone components.
- Use signals for stateful UI.
- Use services for adapters and settings.
- Keep external app integrations behind typed adapter interfaces.
- Do not make undocumented architectural jumps.

## Expected Result

A runnable Angular app with:
- Sidebar navigation
- Dashboard overview
- Calendar card
- Velo cash-flow card
- Dash time/customer card
- sevDesk shortcut
- Settings page
- Configurable external URLs
- Mock data layer
- Clean project documentation
