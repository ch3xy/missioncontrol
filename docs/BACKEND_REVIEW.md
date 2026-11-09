# Backend-Grundgerüst: Stand für das Review

Stand: 2026-11-09, Übergabe zum Review vor dem ersten Commit des Backends.

Dieses Dokument ist die Übergabe für das Review: was entschieden und gebaut wurde, wie es geprüft wurde, worauf
beim Review besonders zu achten ist und was noch offen ist. Die laufende Referenz zum Backend steht in
[BACKEND.md](BACKEND.md), die Entscheidung in `.ai/decisions.md` (Eintrag 2026-11-09).

## 1. Ausgangslage und Entscheidungen

Auslöser war der Wunsch nach einem Tagesplan (Aufgaben, Schätzung, Fortschritt, Kapazität). Daraus folgten in
dieser Reihenfolge:

| Frage                                   | Entscheidung                                                                                                                                                                                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Tagesplan in dash oder mission control? | **mission control.** Ein dash-`Task` hängt zwingend an einem Projekt und trägt Abrechnungsdaten (Stundensatz, billable); private Einträge wie „Steuerberater anrufen“ haben beides nicht. Verknüpfung mit dash-Projekten bleibt später optional. |
| Backend für mission control?            | **Ja**, weil LocalStorage nur pro Browser gilt und mehrere Umgehungen (iCloud-Kalender über vdirsyncer/`.ics`, KI-Nutzungskarte über Skript/`scp`) im Kern ein fehlendes Backend ausgleichen.                                                    |
| Stack                                   | Spring Boot + PostgreSQL wie dash und velo.                                                                                                                                                                                                      |
| Auth                                    | **Stufe 1, kein Login:** Heimnetz/Tailnet ist die Anmeldung, dazu Host- und Origin-Prüfung. Stufe 2 (Basic Auth in Caddy, Tailscale-Serve-Identity) prüft der Nutzer parallel und ist **nicht entschieden**.                                     |
| Reihenfolge                             | Erst Backend-Grundgerüst, danach die Tagesplan-Erweiterung.                                                                                                                                                                                      |

## 2. Was umgesetzt wurde

### Neues Maven-Projekt `backend/`

Aufbau analog zu dash (`com.ch3xy.<app>`, ein Paket pro Modul), aber als Unterordner. Das Frontend bleibt im
Repo-Root; ein Umzug nach `frontend/` wie in dash wurde bewusst nicht gemacht (Aufwand, Risiko, und auf dem Pi
liefert Caddy das Frontend ohnehin statisch aus).

| Datei                                                         | Zweck                                                                                                                                                                                        |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pom.xml`                                                     | Spring Boot 4.1.0, Java 25, JPA, Flyway, PostgreSQL, springdoc 3.0.3, Testcontainers 1.21.1 (ohne `spring-boot-testcontainers`); Surefire setzt `-Dapi.version=${docker.api.version}` (1.44) |
| `docker-compose.yml`                                          | PostgreSQL 17, nur auf `127.0.0.1:5434`, Projektname `missioncontrol-backend`                                                                                                                |
| `mvnw`, `.mvn/`                                               | Maven-Wrapper aus dash übernommen (Maven 3.9.16)                                                                                                                                             |
| `application.yml`                                             | Port 8082, Bind-Adresse, DB und Zugriffslisten über `MC_*`-Variablen, `server.error.include-message: never`                                                                                  |
| `db/migration/V1__create_app_settings.sql`                    | Tabelle `app_settings` (Key/Value wie dash) mit Standardwerten = `DEFAULT_SETTINGS` des Frontends                                                                                            |
| `MissionControlApplication`                                   | Einstiegspunkt                                                                                                                                                                               |
| `common/OpenApiConfig`, `common/error/GlobalExceptionHandler` | 1:1 Muster aus dash (Problem Details, 422 bei Validierung, 409 bei Konflikt)                                                                                                                 |
| `app/HealthController`                                        | `GET /api/v1/health` (Status, Version, Commit, Build-Zeit)                                                                                                                                   |
| `app/AccessPolicy`, `app/AccessGuardFilter`, `app/WebConfig`  | Zugriffsschutz Stufe 1 und CORS aus derselben Origin-Liste                                                                                                                                   |
| `settings/*`                                                  | Entity, Repository, Request/Response, Service, Controller für `GET`/`PUT /api/v1/settings`                                                                                                   |

### Zugriffsschutz Stufe 1

- `Host`-Header muss Loopback (`localhost`, `127.0.0.1`, `[::1]`) oder in `MC_ALLOWED_HOSTS` sein, sonst 403.
- `Origin`-Header: fehlt er, wird durchgelassen (curl, Health-Check); ist er vorhanden, muss er in
  `MC_ALLOWED_ORIGINS` stehen, sonst 403. Schema und Port gehören zum Origin.
- Ohne Konfiguration ist kein Origin erlaubt (`MC_ALLOWED_ORIGINS` leer, produktionssicher; CORS dann aus). Das Profil
  `local` (`application-local.yml`) erlaubt `http://localhost:4200` und `http://localhost:8082` (Swagger UI):
  `./mvnw spring-boot:run -Dspring-boot.run.profiles=local`.
- IPv6-Hosts werden in eckigen Klammern verglichen (`[fe80::1]`); unbeklammerte Einträge in `MC_ALLOWED_HOSTS`
  werden beim Einlesen geklammert, eine blanke IPv6-Adresse wird nie an einem Doppelpunkt abgeschnitten.
- Der Filter hat höchste Priorität und gilt für alle Pfade (auch Swagger).
- Lokal lauscht das Backend nur auf `127.0.0.1` (`MC_BIND_ADDRESS`).
- Der abgelehnte Wert wird nur (ohne Zeilenumbrüche) geloggt, nie in der Antwort zurückgegeben.

### Prüfung der Einstellungen (Service, nicht nur Bean Validation)

- Gleiche Regeln wie das Frontend (`source-urls.ts`). Pflicht-URLs (`veloUrl`, `dashUrl`, `sevDeskUrl`, nicht leere
  `localToolNUrl`): parsbare absolute `http`/`https`-URL mit Host und ohne Benutzer/Passwort.
- Quell-URLs (mehrere pro Zeile): solche URL oder ein Pfad, der mit genau einem `/` beginnt; alles andere wird
  abgelehnt (`arrow.local/x.ics`, `//host/x`, `javascript:`, `data:`, `file:`, `https://user:pw@host/x`).
- Fehler: eigene `ValidationException` (422) und `ConflictException` (409) tragen ihre Meldung zum Client;
  `IllegalArgumentException`/`IllegalStateException` landen im generischen 500 ohne internen Text.
- `calendarSource` ∈ `none`, `ics`, `local-json`; `dailyTargetHours` in (0, 24]; `autoRefreshMinutes` ∈
  {0, 1, 5, 15, 30}.
- Fehlende Felder ergeben 422, auch `autoRefreshMinutes` (deshalb `Integer` mit `@NotNull`, ein primitives `int`
  führte zu 400 durch Jackson 3).

### Dokumentation und Projektregeln

- Neu: `docs/BACKEND.md` (Betrieb, Konfiguration, API, Zugriffsschutz, Deploy-Plan), dieses Dokument.
- `.ai/decisions.md`: neuer Eintrag 2026-11-09.
- `AGENTS.md`: „frontend-only“, „No backend“ und „Keep all changes frontend-only“ angepasst.
- `README.md`, `.ai/stack.md`, `.ai/README.md`: Verweise auf das Backend; `docs/NO_BACKEND_DECISION.md` als abgelöst
  markiert.
- `.gitignore`: `/backend/target/`, `/backend/.mvn/wrapper/maven-wrapper.jar`.

### Nicht angefasst

Frontend-Code (`src/`), `e2e/`, `proxy.conf.mjs`, `package.json`, `../dash`, `../velo`.

### Nachbesserung nach dem ersten Review

- URL-Prüfung an das Frontend angeglichen (siehe oben), mit Tests für `arrow.local/x.ics`, `//evil.example/x.ics`,
  `javascript:` und URLs mit Benutzerinfo.
- `MC_ALLOWED_ORIGINS` standardmäßig leer; Dev-Origins nur im Profil `local`; Tests für beide Fälle.
- Eigene `ValidationException`/`ConflictException` statt pauschalem Mapping von `IllegalArgumentException`/
  `IllegalStateException`.
- Abhängigkeit `spring-boot-testcontainers` entfernt (nicht benötigt); Surefire-`argLine` mit `@{argLine}`.
- Migrationstest läuft gegen ein eigenes Schema (`mig_check`) und ist nicht mehr reihenfolgeabhängig.

## 3. Wie geprüft wurde

| Prüfung                                                                                  | Ergebnis                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `./mvnw verify` in `backend/`                                                            | **34 Tests, 0 Fehler** (11 Unit-Tests: `AccessPolicyTest` 8, `GlobalExceptionHandlerTest` 3; `MissionControlApplicationTests` 1; 22 Integrationstests gegen PostgreSQL 17 per Testcontainers: `AppSettingsServiceIntegrationTest` 8, `AppSettingsControllerIntegrationTest` 5, `AccessGuardIntegrationTest` 6, `LocalProfileAccessIntegrationTest` 3) |
| Start des gebauten Jars gegen echte Compose-Datenbank                                    | Health `200` mit Version und Commit; Settings liefern die Migrations-Defaults; `v3/api-docs` `200`                                                                                                                                                                                                                                                    |
| Zugriffsschutz per curl                                                                  | fremder `Host` → 403; fremder `Origin` → 403; erlaubter Host (`arrow.local`) → 200                                                                                                                                                                                                                                                                    |
| Bind-Adresse                                                                             | Port 8082 nur auf Loopback (`ss`)                                                                                                                                                                                                                                                                                                                     |
| `npx prettier --check` auf `README.md`, `docs/BACKEND.md`, `docs/NO_BACKEND_DECISION.md` | grün                                                                                                                                                                                                                                                                                                                                                  |
| `npm run typecheck`                                                                      | grün (Frontend unverändert)                                                                                                                                                                                                                                                                                                                           |

**Nicht geprüft:**

- `npm run lint`, `npm run test` und `npm run build` wurden **nicht** im Sinn der Projektregel ausgeführt: nvm fehlt in
  der Umgebung, Node ist 24 statt 26.3.1. Nur Typecheck und Prettier auf den geänderten Markdown-Dateien liefen.
  Da kein Frontend-Code geändert wurde, ist das Risiko gering, die Regel ist trotzdem nicht erfüllt.
- Playwright (`e2e/`) wurde nicht ausgeführt; es gibt keine sichtbare UI-Änderung.
- Kein Test hinter einem echten Caddy, kein Test mit `X-Forwarded-*`-Headern, kein Test aus dem Tailnet.
- Keine Last- oder Sicherheitstests über die oben genannten Fälle hinaus.

## 4. Abweichungen und Zwischenfälle (zur Transparenz)

- **Docker-API-Version:** Docker Engine 29 (min. API 1.40) lehnt die von Testcontainers 1.21 gesendete Version 1.32
  ab („Could not find a valid Docker environment“). Lösung: `docker.api.version=1.44` in der pom. Das gilt vermutlich
  auch für dash; dort wurde nichts geändert.
- **Ports:** Die Datenbank nutzt `5434`, weil velo-db `5432` und dash-db `5433` belegen.
- **`git.properties` im Unterordner:** Das Maven-Plugin findet das Repo im übergeordneten Ordner; `failOnNoGitDirectory`
  ist auf `false` gesetzt. Der Health-Endpunkt meldete `dirty: false`, obwohl `backend/` untracked war (untracked
  Dateien zählen nicht als „dirty“).

## 5. Worauf das Review besonders achten sollte

1. **Host/Origin-Prüfung** (`AccessPolicy`, `AccessGuardFilter`): Reicht sie gegen Rebinding und CSRF? Sie nutzt den
   rohen `Host`-Header, nicht `getServerName()`, weil `forward-headers-strategy: framework` Letzteres umschreibt.
   Das setzt voraus, dass Caddy den ursprünglichen `Host` weiterreicht (Standard bei `reverse_proxy`).
2. **Tailscale-IP-Zugriff:** Wer das Backend über eine Tailnet-IP (`100.x.y.z`) statt über einen Namen aufruft, wird mit
   403 abgewiesen, solange die IP nicht in `MC_ALLOWED_HOSTS` steht. Gewollt, aber leicht zu übersehen.
3. **Origin fehlt = erlaubt:** Das ist für curl und Health-Checks nötig. Ein Angreifer ohne Browser-Origin ist durch
   das Netz geschützt, nicht durch diese Prüfung. Einfache Cross-Site-GETs senden in Browsern oft keinen Origin
   (Navigationen); sie lesen aber nichts aus, und alle ändernden Aufrufe verlangen JSON (kein einfaches Formular).
4. **Validierung der URLs** (`AppSettingsService`): angeglichen an das Frontend. Erlaubt sind absolute `http(s)`-URLs
   ohne Benutzer/Passwort und Pfade mit genau einem führenden `/`. Abgelehnt werden damit auch harmlose Eingaben
   ohne Schema (`host:8080/x`, `arrow.local/x.ics`, Windows-Pfade wie `C:\...`). Prüfen, ob das für reale Eingaben
   zu streng ist und ob `java.net.URI` und `new URL()` in Randfällen abweichen.
5. **Settings als Key/Value** mit Leerstring für „nicht gesetzt“ (`value text not null`): Das Frontend kennt
   `undefined` für optionale Felder, das Backend liefert `""`. Beim Anbinden braucht es eine Abbildung.
6. **`include-message: never`** (dash: `always`): bewusst strenger, da Fehlertexte über die Problem-Details laufen.
7. **`@Order(HIGHEST_PRECEDENCE)`** vor dem Forwarded-Header- und CORS-Filter: Preflight-Requests (`OPTIONS`) müssen
   ebenfalls Host und Origin bestehen. Für den Dev-Fall (4200 direkt auf 8082) ist der Origin nur mit Profil `local` erlaubt.
8. **Testcontainers 1.21.1** ist wie in dash gewählt, obwohl Spring Boot 4 neuere Versionen kennt; Angleichung vor
   Aktualisierung.
9. **Doku-Änderungen an Projektregeln** (`AGENTS.md`, `.ai/stack.md`): Formulierung prüfen, besonders „Backend bleibt
   schlank, kein zweites dash“.

## 6. Was noch offen ist

### Direkt anschließend

- [x] **Review**, danach Commit(s).
- [x] **`npm run lint`, `npm run test -- --watch=false`, `npm run build`** mit Node 26.3.1 (grün, 90 Tests).
- [ ] **URL-Prüfung Frontend/Backend endgültig angleichen:** `new URL()` (Frontend) und `java.net.URI` (Backend)
      unterscheiden sich bei Hosts mit Unterstrich, IDN-Hosts, Leerzeichen im Pfad und `https://@host`. Beim Anbinden
      eine gemeinsame, strengere Regel festlegen und in beiden Seiten testen.
- [x] **Frontend an das Backend anbinden:** `SettingsService` liest/schreibt über `SettingsApi`; keine Migration
      der LocalStorage-Einstellungen (Entscheidung 2026-11-09, Export/Import reicht); Hinweis mit „Erneut laden“,
      wenn das Backend nicht erreichbar ist; `/api` in `proxy.conf.mjs`.
- [x] **Playwright-Tests** gegen ein eigenes Test-Backend (`e2e/backend.yml`, Wegwerf-DB), siehe
      `docs/PLAYWRIGHT_STRATEGY.md`.

### Tagesplan (umgesetzt 2026-11-09)

Entschieden am 2026-11-09 (Details in `.ai/decisions.md`): Schätzung optional, Liste und Board per Umschalter
(Ansicht in LocalStorage), Übernahme unerledigter Aufgaben als Vorschlag, Kapazität = Tagesziel minus Termine.

Umgesetzt: Tabelle `task` (V2) und API `/api/v1/tasks`, Seite „Heute“ (`/today`) mit Liste/Board, Kapazität
(Tagesziel minus Termine), Übernahme-Vorschlag, Brain-Dump, Bearbeiten, Reihenfolge, Drag-and-drop im Board.

- [ ] Optional später: Verknüpfung mit dash-Projekten (Phase 2), Tagesplan-Karte im Dashboard, andere Tage als
      heute ansehen/planen.

### Deployment (nicht begonnen, `../pi-ops` liegt nicht im Checkout)

- [ ] Container-Image für das Jar, PostgreSQL-Service im pi-ops-Compose, Port nicht veröffentlichen.
- [ ] Caddy: Frontend statisch unter `/missioncontrol`, `handle /missioncontrol/api/*` mit
      `uri strip_prefix /missioncontrol` an das Backend (es erhält `/api/v1/...`; `handle_path /missioncontrol/api*`
      wäre falsch, es würde auch `/api` abschneiden und 404 liefern), Original-`Host` weiterreichen.
- [ ] `MC_ALLOWED_HOSTS`, `MC_ALLOWED_ORIGINS`, `MC_BIND_ADDRESS=0.0.0.0`, DB-Zugangsdaten setzen (kein
      Standardpasswort in Produktion).
- [ ] Release-Skript analog `scripts/deploy.sh` in dash; Versionsschema abstimmen.
- [ ] Datenbank-Backups für die neue DB.

### Später

- [ ] iCloud-Kalender-Sync im Backend (CalDAV, Passwort nur schreibbar, `.ics`-Auslieferung ersetzen oder schützen);
      löst die Umgehung vom 2026-10-21 ab.
- [ ] Endpunkt für die zurückgestellte KI-Nutzungskarte (Eintrag 2026-11-02) statt `scp` und statischer JSON.
- [ ] **Zugriffsschutz Stufe 2** (Basic Auth in Caddy oder Tailscale-Serve-Identity): wird vom Nutzer getrennt geprüft.
      Zwingend, sobald jemand anderes Zugriff bekommt, das Backend ins Internet geht oder sensiblere Secrets (z. B.
      sevDesk-API-Key) dazukommen.
- [ ] Tailscale-ACLs so setzen, dass nur eigene Geräte den Pi erreichen (außerhalb dieses Repos).
- [x] Doku-Bereinigung: `.ai/comparison.md`, `docs/ARCHITECTURE.md`, `docs/MVP_STATUS.md` und weitere
      „frontend-only/kein Backend“-Aussagen sind aktualisiert; historische Planungs-/Prompt-Dokumente tragen einen
      Hinweis oben.
- [ ] Prüfen, ob dash dieselbe `api.version`-Einstellung für Testcontainers braucht.
