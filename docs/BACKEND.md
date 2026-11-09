# Backend

Slim Spring Boot backend of mission control, same stack and conventions as dash (decision 2026-11-09 in
`.ai/decisions.md`). It lives in `backend/` as its own Maven project; the Angular frontend stays in the repo root.

**State:** settings API; the frontend reads and writes its settings here (`SettingsApi`, `api/v1/settings` relative to
`<base href>`). Without the backend it shows the defaults and a notice, saving is disabled. The daily plan (`task` module, page
`/today`) uses the task API. Next: calendar sync and the AI-usage endpoint.

## Stack

Java 25, Spring Boot 4.1.0, Spring Data JPA, Flyway, PostgreSQL 17, springdoc 3.0.3 (Swagger UI),
Testcontainers. Package `com.ch3xy.missioncontrol`, one package per module (`settings`, later `task`, `calendar`).

## Run

```bash
cd backend
docker compose up -d        # PostgreSQL on 127.0.0.1:5434 (velo uses 5432, dash 5433)
./mvnw spring-boot:run -Dspring-boot.run.profiles=local   # http://localhost:8082, dev origins allowed
./mvnw verify               # unit + integration tests (needs Docker)
```

Frontend: `npm start` proxies `/api` to `http://localhost:8082` (`proxy.conf.mjs`, override with `MC_API_TARGET`).

Playwright starts its own backend: configuration `e2e/backend.yml` (port 8092, not part of the jar) on a throw-away PostgreSQL from
`docker-compose.e2e.yml` (port 5435, tmpfs), removed by the global teardown. See `e2e/README.md`.

- API: `http://localhost:8082/api/v1/...`, OpenAPI at `/v3/api-docs`, Swagger UI at `/swagger-ui/index.html`
- Errors are RFC 7807 Problem Details (422 for validation, 409 for conflicts), as in dash. Only the backend's own
  `ValidationException` (422) and `ConflictException` (409) carry their message to the client; any other exception,
  including `IllegalArgumentException` and `IllegalStateException`, ends in a generic 500 "Internal error".
- Without the `local` profile no browser origin is allowed (production-safe). The profile
  (`application-local.yml`) allows `http://localhost:4200` and `http://127.0.0.1:4200` (Angular dev server) and `http://localhost:8082` (Swagger UI).
- Tests start their own PostgreSQL via Testcontainers. Docker Engine 29 needs a newer API version than Testcontainers
  1.21 sends; the pom sets `-Dapi.version=1.44` for the test JVM (`docker.api.version`).

## Configuration (environment)

| Variable                                      | Default                                                                                                         | Meaning                                                                                                                  |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `MC_DB_URL` / `MC_DB_USER` / `MC_DB_PASSWORD` | URL `localhost:5434/missioncontrol`; user/password no default (profile `local`: `missioncontrol`)               | Database                                                                                                                 |
| `MC_BIND_ADDRESS`                             | `127.0.0.1`                                                                                                     | Listen address; `0.0.0.0` only inside the container network                                                              |
| `MC_ALLOWED_HOSTS`                            | empty (loopback only)                                                                                           | Allowed `Host` names, comma separated, e.g. `arrow.local,arrow-pi.tailnet.ts.net`; IPv6 in square brackets (`[fe80::1]`) |
| `MC_ALLOWED_ORIGINS`                          | empty (no browser origin); `local` profile: `http://localhost:4200,http://127.0.0.1:4200,http://localhost:8082` | Allowed browser origins, comma separated, e.g. `https://arrow.local`                                                     |

## API (v1)

| Method       | Path                              | Purpose                                                                                              |
| ------------ | --------------------------------- | ---------------------------------------------------------------------------------------------------- |
| GET          | `/api/v1/health`                  | Status, version, git commit                                                                          |
| GET / PUT    | `/api/v1/settings`                | All mission control settings (PUT replaces, optional fields as empty string)                         |
| GET          | `/api/v1/tasks?date=YYYY-MM-DD`   | Tasks of a day in order; without `date` the brain dump                                               |
| GET          | `/api/v1/tasks/carry-over?date=…` | Unfinished tasks of earlier days (carry-over suggestions)                                            |
| POST         | `/api/v1/tasks`                   | New task (`title`, optional `estimateMinutes` 1–1440, `planDate` or `null` for the brain dump), 201  |
| PUT / DELETE | `/api/v1/tasks/{id}`              | Replace title, estimate (`null` removes it) and status (`OPEN`, `IN_PROGRESS`, `DONE`); delete (204) |
| POST         | `/api/v1/tasks/move`              | Move tasks to the end of a day (`backlog: false`, `planDate`) or to the brain dump (`backlog: true`) |
| PUT          | `/api/v1/tasks/order`             | New order of all tasks of a day or the brain dump; 409 if the list is stale                          |

Tasks carry a `version` (optimistic locking): `PUT /api/v1/tasks/{id}` must send the version it is based on,
otherwise 409 (also when two requests race), so a change from another device is not silently overwritten. Reordering
does not change the version; moving to another day does (an edit open elsewhere then gets 409). `DELETE` also needs
`?version=`. `move` and `order` need an explicit
`backlog` flag (`true` = brain dump without `planDate`, `false` = day with `planDate`); a missing date is never read
as "brain dump". Reordering accepts at most 5000 tasks per day or brain dump (moves go in batches of 500).

Settings mirror `MissionControlSettings` in `src/app/core/models/settings.model.ts`; the Flyway defaults mirror
`DEFAULT_SETTINGS`. The service applies the same URL rules as the frontend (`source-urls.ts`): the required URLs
(`veloUrl`, `dashUrl`, `sevDeskUrl`, non-empty `localToolNUrl`) must be absolute http(s) URLs with a host and without user
name or password. Each line of a source field (`calendarSourceUrl`, `veloSourceUrl`, `dashSourceUrl`, `veloApiUrl`,
`dashApiUrl`) must be such a URL or a path starting with a single `/`; everything else (`arrow.local/x.ics`,
`//host/x`, `javascript:`, `data:`, `file:`, `https://user:pw@host/x`) is rejected with 422. It also rejects unknown calendar sources,
a daily target outside 0–24 h and refresh intervals other than 0/1/5/15/30.

## Access protection, stage 1

The home network and the tailnet are the login; there is no user management. Two checks protect against a browser on
that network being used against the API (`AccessPolicy`, `AccessGuardFilter`):

- **Host** must be loopback or in `MC_ALLOWED_HOSTS` (DNS rebinding reaches the server under the attacker's name).
- **Origin**, if sent, must be in `MC_ALLOWED_ORIGINS` (cross-site requests always carry the foreign origin).

With an empty origin list every request that carries an Origin header is refused and CORS is off. Requests without an Origin header (curl, container health checks) pass the second check. Violations get 403.
Secrets, once there are any (CalDAV password), are write-only through the API. Stage 2 (Basic Auth in Caddy,
Tailscale Serve identity headers) is tracked separately and not decided.

## Deployment (open)

Not wired yet; `../pi-ops` (release scripts, Caddy, compose) is not part of this repository checkout, so nothing was
changed there. Planned:

- Container image for the jar plus a PostgreSQL service in the pi-ops compose file; the backend port is not published,
  it is reachable only from Caddy in the internal container network.
- Caddy: serve the frontend statically under `/missioncontrol`; `handle /missioncontrol/api/*` with
  `uri strip_prefix /missioncontrol` and `reverse_proxy` to the backend, so it receives `/api/v1/...` (not
  `handle_path /missioncontrol/api*`, which would also strip `/api` and cause 404). The original `Host` is
  forwarded (Caddy default). Unlike `handle_path /velo*` / `/dash*`, which strip only the app prefix, the
  backend paths here start with `/api`.
- Set `MC_ALLOWED_HOSTS` and `MC_ALLOWED_ORIGINS` to the public names of the Pi; set `MC_BIND_ADDRESS=0.0.0.0`.
- A release script analogous to `scripts/deploy.sh` in dash.
- The `/missioncontrol/api/*` route must be matched before the static frontend and its SPA fallback, otherwise the
  fallback answers API calls with `index.html`.
