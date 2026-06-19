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
- No API keys, tokens, OAuth flows, or sevDesk private API calls are part of the MVP.
- Angular CLI builds use Node.js 26 for this repository; `.nvmrc` pins `26.3.1`.
