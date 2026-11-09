# Assumptions

Codex should update this file during implementation.

Initial assumptions:

- Mission Control is used by one person locally.
- Velo runs in the local network or locally.
- Dash runs in the local network or locally.
- sevDesk starts as an external shortcut.
- Originally the MVP had no backend. Since 2026-11-09 the backend stores the settings (`docs/BACKEND.md`); without it the app runs only with the defaults and saving disabled.
- Calendar data starts as mock data.
- Real integrations can be added later through adapters.

Implementation assumptions:

- External Velo, Dash, and sevDesk entries are launch shortcuts only.
- Default URLs are `http://localhost:4201`, `http://localhost:4202`, and `https://my.sevdesk.de`.
- Settings are stored in the backend (since 2026-11-09). Existing LocalStorage settings are not migrated; the JSON export/import of older versions can be used to carry them over. LocalStorage only keeps UI state (theme, language, views).
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
- The UI language was initially kept English; see the language section below.
- A theme preference (Light/Dark/System) was added as part of the design alignment; it is stored in `missioncontrol-theme` and does not affect existing settings or backups.
- The sidebar version line reads `version` from `package.json` (`resolveJsonModule`).
- Playwright E2E tests (as in dash) are not set up yet.
- velo and dash were only read as references and not modified.

UI language (2026-10-19):

- The UI is German by default, like velo and dash, and can be switched to English under Settings → Sprache / Language.
- The choice is stored per browser in `missioncontrol-lang` (`de` / `en`). It is not part of the settings export/import, the same as the theme.
- Translation is a small signal-based `I18nService` with typed dictionaries (`src/app/core/i18n/translations.ts`) instead of Angular's build-time `@angular/localize`, because the language must switch at runtime without a reload or one build per locale.
- German uses the `de-AT` locale for dates, numbers and currency (as in velo/dash); English uses `en-US`. `LOCALE_ID` stays at its default; templates pass `i18n.locale()` to the date/number/currency pipes.
- Route titles are translation keys, resolved by `I18nTitleStrategy`.
- Data stays untranslated: event titles, customer names and the `periodLabel` from local Velo JSON are shown as delivered, as are user-defined tool labels and the ICS fallback title "Untitled event".

Live data from velo and dash (2026-10-19):

- mission control reads the existing REST APIs of velo and dash read-only; velo and dash stay unchanged. The frontend still talks to velo and dash directly; the mission control backend (`backend/`, `docs/BACKEND.md`, decision 2026-11-09) is not connected yet.
- The configured value is the app's base URL (e.g. `https://arrow.local/velo`), because in production each Spring backend serves its frontend and `/api` under one path behind Caddy.
- Deployment assumption: mission control runs on the same host as velo and dash behind Caddy, so requests are same-origin. Cross-origin access would need CORS in velo/dash (dash: `app.cors.allowed-origins`; velo has no CORS configuration).
- If mission control itself is served at the root of that host, its own routes `/velo` and `/dash` collide with Caddy's `handle_path /velo*` and `/dash*`; it should get its own path prefix (e.g. `/missioncontrol`).
- velo: all EUR accounts are summed (balance and 30-day forecast); accounts in other currencies are skipped because the card shows one EUR amount. The forecast horizon is fixed at 30 days.
- dash: "today" is dash's own `today.durationSeconds`; a running timer is not added. Active customers are non-archived clients, open projects are projects with status `ACTIVE`.
- dash has no daily target, so mission control keeps one as a setting (default 8 h).
- An API URL takes precedence over a local JSON URL; on any API error the card shows a warning and no data.
- velo and dash have no authentication; if they get one, the adapters need to send credentials (cookies work same-origin).
- Dev proxy targets default to `http://localhost:8081` (velo) and `http://localhost:8080` (dash), because both backends default to port 8080 and cannot run side by side without changing one.

No mock data (2026-10-19):

- The built-in mock data was removed at the user's request; it superseded the earlier assumptions "Calendar data starts as mock data" and "fall back to mock data" above.
- Without a configured source a card shows "Nicht konfiguriert" with a hint to Settings; if a configured source is unreachable or returns invalid data it shows "Warnung" and no numbers. Showing invented numbers next to real ones was considered misleading.
- The calendar source `mock` became `none` (the default). Stored settings or imported backups with `mock` are normalized to `none`.
- Adapters return `null` (Velo, Dash) or an empty list (Calendar) instead of data; their status signal is `null` while loading so no notice flashes before the first result.

Deployment on arrow-pi (2026-10-19):

- mission control is served by the existing Caddy container as static files under `/missioncontrol/` (no own container, no Node on the Pi); `/` redirects there. Configuration and deploy script are in `pi-ops`.
- The path prefix avoids the collision of mission control's own `/velo` and `/dash` routes with Caddy's `handle_path /velo*` and `/dash*`.
- The build is made locally with `npm run build:pi` (`--base-href /missioncontrol/`); the deploy script refuses builds with another base href.
- Bundled example presets in Settings resolve against `<base href>` instead of the origin root.
- External launch URLs (Velo, Dash) keep their localhost defaults; on the server they are set in Settings (e.g. `http://arrow.local/velo/`).

Private iCloud calendars (2026-10-21):

- iCloud calendars are not shared publicly. A vdirsyncer job on arrow-pi reads them via CalDAV with an app-specific password and writes one `.ics` file per calendar; Caddy serves them under `/missioncontrol/calendars/`. Setup: `docs/ICLOUD_CALENDAR.md`. The mission control frontend never sees the Apple ID credentials; a CalDAV sync in the backend is planned (`docs/BACKEND.md`).
- The calendar source URL field takes several URLs, one per line, for both ICS and local JSON. The setting stays a single string (`calendarSourceUrl`), so existing settings and backups keep working unchanged.
- Besides absolute http(s) URLs without user name or password, the field accepts paths starting with a single `/` (same host). Relative paths without `/`, protocol-relative `//host/x` and scheme-less hosts are rejected to avoid mistaking `arrow.local/x.ics` for a path. The backend (`AppSettingsService`) applies the same rule.
- Sources are loaded in parallel and merged; duplicates (same `id` and `startsAt`) are dropped. If some sources fail, the others are still shown, with a warning (`status.calendar.partiallyLoaded`).
- An ICS response without `BEGIN:VCALENDAR` is invalid (it is typically the `index.html` fallback of Caddy's `try_files`); an ICS calendar without events is now valid and empty instead of a warning, since a synced calendar can legitimately be empty.
- The calendars live in `/home/pi/apps/calendars`, not inside `/home/pi/apps/missioncontrol`, because the deploy script rsyncs the build into that directory.
- The dev server forwards `/missioncontrol/calendars` to `CALENDARS_TARGET` (default `http://arrow.local`).
- The Caddy and compose changes belong to `pi-ops` and are only documented here, not applied.

Recurring calendar events (2026-10-21):

- ICS parsing uses `ical.js` (Mozilla, MPL-2.0, ~25 kB gzip) instead of the former hand-written parser. RRULE expansion with EXDATE, RECURRENCE-ID and VTIMEZONE conversion is easy to get subtly wrong (BYSETPOS, DST, THISANDFUTURE), and a well-tested library is cheaper than maintaining our own.
- Occurrences are generated from the start of today up to one year ahead. The agenda shows upcoming appointments, so past occurrences of a series are not shown; non-recurring events are still returned unfiltered as before. (Superseded 2026-10-27, see below.)
- All occurrences keep the series `UID` as `id`; lists track and deduplicate by `id` + `startsAt`.
- All-day events keep the previous representation (00:00 UTC of their date), so the agenda, which groups by the UTC date, keeps them on the right day.
- Expansion stops after 50,000 iterations per series as a guard against endless rules; that covers a daily series starting more than 100 years ago.
- `TZID` values without a matching `VTIMEZONE` fall back to the browser's time zone, as before.

Dashboard background refresh (2026-10-23):

- The dashboard reloads calendar, velo and dash data every 5 minutes by default; Settings offers off, 1, 5, 15 and 30 minutes (`autoRefreshMinutes`). Older settings and backups without the field get the default; unknown values fall back to it.
- While the tab is hidden, ticks are skipped so no requests run for a dashboard nobody looks at. On returning to the tab, data older than the interval is reloaded immediately.
- Background reloads reuse the manual refresh: the visible data stays until new data arrives, and a reload that is still running is not started a second time.
- Only the dashboard refreshes itself; the calendar, velo and dash pages keep loading once on open.

Review fixes (2026-10-27):

- Recurring events are expanded from the start of the month one year back to the end of the month one year ahead, so past days of the current week and month show their series. A moved occurrence is found up to 31 days beyond that window.
- `STATUS:CANCELLED` hides events and single occurrences; a cancelled occurrence without `DTSTART` acts like an `EXDATE`. Changed occurrences are only related to the series with the same `UID`.
- Every fetch (local JSON, REST APIs, ICS) is aborted after 15 seconds. The dashboard updates each card as soon as its source answers; a failing load no longer leaves the refresh blocked.
- Times of day (top bar date, "Today", highlighted day) follow a shared clock that ticks every minute, so an open tab rolls over at midnight.
- Imported and stored settings are checked field by field; files that are not a JSON object are rejected. If the backend cannot be reached, the defaults apply, saving is disabled and Dashboard and Settings show a notice with a retry button.
- URLs with user name or password are rejected, because settings are stored and exported in plain text. Secret calendar links should not be entered either; iCloud is read through vdirsyncer on the server instead.
- The velo forecast only sums dates that every EUR account covers.

## Playwright-Suite (08.11.2026)

- Eigenes npm-Paket unter `e2e/`; keine Kopplung an Builds oder Deployments.
- Chromium Desktop und Pixel-7-Emulation bilden die erste Browserabdeckung; das Backend (`backend/`, siehe `docs/BACKEND.md`) ist nicht Teil dieser Browserabdeckung.
- Ein isolierter Angular-Testserver auf Port 4300 ohne Entwicklungs-Proxys und frische Browserkontexte verhindern Nutzung persönlicher Konfiguration. Externe Browserrequests werden blockiert.
- Synthetische JSON-/ICS-Antworten dienen gezielter Adapter-/Fehlerprüfung im Browser. Tests gegen dedizierte echte Velo-/Dash-Instanzen bleiben offen und werden nicht als Fullstack-E2E ausgewiesen.
