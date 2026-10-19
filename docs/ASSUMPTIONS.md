# Assumptions

Codex should update this file during implementation.

Initial assumptions:

- Mission Control is used by one person locally.
- Velo runs in the local network or locally.
- Dash runs in the local network or locally.
- sevDesk starts as an external shortcut.
- The MVP should not require a backend.
- Calendar data starts as mock data.
- Real integrations can be added later through adapters.

Implementation assumptions:

- External Velo, Dash, and sevDesk entries are launch shortcuts only.
- Default URLs are `http://localhost:4201`, `http://localhost:4202`, and `https://my.sevdesk.de`.
- Settings are stored only in browser LocalStorage.
- Calendar, Velo, and Dash data are provided by typed mock adapters for now.
- Placeholder source URL fields exist in Settings so later local JSON or ICS adapters can be added without changing the UI.
- Local JSON source URLs are optional placeholders and fall back to mock data when a request fails or the response shape is invalid.
- Two optional local tool shortcuts can be configured in Settings and are hidden until a valid http(s) URL is set.
- No API keys, tokens, OAuth flows, or sevDesk private API calls are part of the MVP.
- Angular CLI builds use Node.js 26 for this repository; `.nvmrc` pins `26.3.1`.

Design and stack alignment with velo/dash (2026-10-19):

- The Arrow corporate design (`docs/arrow-corporate-design.md`, master in dash) replaces the former Visual 3 dark palette; Visual 3 remains the layout direction (sidebar, top bar, widget grid).
- The frontend stack follows dash, not velo: no Angular Material, zoneless change detection, OnPush, Lucide icons, self-hosted Inter, SCSS.
- Token names and global component classes are copied 1:1 from dash so styles stay interchangeable; mission control keeps its own 12-column widget grid.
- Widget cards no longer have colored accent dots: semantic colors are reserved for status, so the `accent` input of `app-widget-card` was removed.
- The UI language stays English for now and date/number formats are unchanged; switching to German and de-AT formats (like velo/dash) is a content change for a later step.
- A theme preference (Light/Dark/System) was added as part of the design alignment; it is stored in `missioncontrol-theme` and does not affect existing settings or backups.
- The sidebar version line reads `version` from `package.json` (`resolveJsonModule`).
- Playwright E2E tests (as in dash) are not set up yet.
- velo and dash were only read as references and not modified.
