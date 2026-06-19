# Codex Master Prompt — Autonomous Build

Use this prompt in Codex to start the implementation.

```text
You are working on the project "Mission Control".

Goal:
Build a local-first, frontend-only Angular 22 application that acts as a central dashboard for a freelance software developer.

Read and follow:
- AGENTS.md
- docs/ARCHITECTURE.md
- docs/UI_UX_SPEC.md
- docs/DATA_CONTRACTS.md
- docs/DEVELOPMENT_PLAN.md
- docs/CODEX_TASKS.md
- docs/NO_BACKEND_DECISION.md
- docs/PROJECT_STRUCTURE.md

Autonomy:
Work as independently as possible. Do not ask the user for approvals for normal implementation decisions. Make pragmatic decisions and continue. Only stop if you are blocked by missing credentials, destructive actions, or a requirement that cannot be satisfied in a frontend-only app.

Implementation rules:
- Keep the MVP frontend-only.
- Use Angular 22 with standalone components.
- Use strict TypeScript.
- Use signals for state where useful.
- Use LocalStorage for configurable settings.
- Use mock adapters first for Calendar, Velo, Dash, and shortcuts.
- Do not introduce a backend.
- Do not store secrets in frontend code.
- Do not call private APIs that require secrets.
- Prefer a complete working MVP over partial perfect abstractions.

Design:
Implement the Visual 3 concept (see docs/visuals.png):
- Dark sidebar
- Widget grid
- Compact top bar
- Calendar widget
- Velo cash-flow widget
- Dash time-tracking/customer widget
- Quick access tiles
- Responsive desktop/tablet layout

Default external URLs:
- Velo: http://localhost:4201
- Dash: http://localhost:4202
- sevDesk: https://my.sevdesk.de

Expected workflow:
1. Inspect the repo.
2. If no Angular app exists, create one.
3. Add or update scripts for start/build/test/lint where appropriate.
4. Implement the app shell, routes, layout, dashboard, widgets, settings, adapters, and mock data.
5. Run build/tests/lint if available.
6. Fix issues.
7. Update documentation with assumptions and remaining work.
8. Provide a final summary including changed files, commands run, and remaining limitations.

Do not wait for user confirmation between these steps.
```
