# Tech-Stack

mission control ist ein reines Frontend (kein Backend, siehe `docs/NO_BACKEND_DECISION.md`).
Der Frontend-Stack ist bewusst **identisch mit dash** (`dash/frontend`), damit Wissen, Snippets und
Konfiguration zwischen den Projekten austauschbar sind.

## Laufzeit & Tooling

| Komponente | Version | Hinweis |
|---|---|---|
| Node.js | 26.3.1 (`.nvmrc`) | `nvm use` vor allen npm-Befehlen (Shell-Default kann älter sein) |
| npm | 11.16.0 (`packageManager`) | Lockfile nur mit dieser Version schreiben |
| Angular | ^22.0.0 | Standalone, Zoneless, Signals |
| TypeScript | ~6.0.2 | `strict`, `strictTemplates` |
| Vitest | ^4.0.8 | über `@angular/build:unit-test`, Umgebung jsdom |
| Prettier | ^3.8.1 | `.prettierrc` identisch mit dash |

## Bibliotheken

| Paket | Version | Zweck |
|---|---|---|
| `@lucide/angular` | ^1.59.0 | Icons (Arrow-Standard), Default `size 16`, `strokeWidth 1.75` |
| `@fontsource-variable/inter` | ^5.3.0 | Inter selbst gehostet (keine Font-CDN) |
| `ical.js` | ^2.2.1 | ICS-Parsing inkl. Wiederholungen (RRULE/EXDATE/RECURRENCE-ID) und VTIMEZONE (MPL-2.0) |

Bewusst **nicht** verwendet: Angular Material (velo nutzt es, dash nicht — mission control folgt dash),
Tailwind, Chart-Bibliotheken (der Trend-Sparkline ist ein eigenes SVG).

## Konfiguration

- `angular.json`
  - Styles: `src/styles.scss`, `inlineStyleLanguage: scss`
  - Schematics: Komponenten mit `style: scss` und `changeDetection: OnPush`
  - Budgets: initial 1 MB Warnung / 2 MB Fehler, Komponenten-Styles 8 kB / 12 kB
- `src/app/app.config.ts`
  ```ts
  provideBrowserGlobalErrorListeners(),
  provideZonelessChangeDetection(),
  provideRouter(routes),
  provideLucideConfig({ size: 16, strokeWidth: 1.75 }),
  ```
  Kein `zone.js` in den Polyfills.
- `tsconfig.json`: `resolveJsonModule` aktiv (Versionsanzeige `v{version}` aus `package.json` in der Sidebar).

## Befehle

```bash
source ~/.nvm/nvm.sh && nvm use
npm install
npm run start          # Dev-Server, http://localhost:4200
npm run build          # Produktions-Build nach dist/missioncontrol
npm run test -- --watch=false
npm run lint           # typecheck + prettier --check
npm run format         # prettier --write
```

`start`, `build`, `build:pi` und `watch` laufen über `scripts/ng-with-build-info.mjs`: Es übergibt Commit,
„dirty“-Flag und Build-Zeit per `ng … --define MC_BUILD_INFO=…` (gelesen in `core/build-info.ts`). Direkt
aufgerufenes `ng build` und die Unit-Tests haben keine Build-Info; die Sidebar zeigt dann nur die Version.

## Versionierung

- SemVer in `package.json` ist die einzige Quelle der Version (Gegenstück zur `<version>` in den POMs von velo/dash).
- Die Sidebar zeigt `v<version>`; der Tooltip zeigt Commit und Build-Zeit, `-dirty` bei uncommitteten Änderungen.
- Keine Buildnummer: Gebaut und deployt wird lokal ohne CI, der Commit identifiziert einen Build eindeutig.
- Neue Version bei sauberem Working Tree, danach bauen und deployen:

```bash
npm version patch -m "Release %s"   # Fehlerbehebungen; minor = neue Funktionen, major = Brüche
git push --follow-tags              # erst nach Rückfrage
```

`npm version` passt `package.json` und `package-lock.json` an, committet und setzt den Tag `v<version>`.
Vor 1.0.0 dürfen auch minor-Versionen Brüche enthalten.

## Offene Punkte gegenüber dash

| Thema | dash | mission control |
|---|---|---|
| E2E-Tests | Playwright (`@playwright/test`) | noch nicht eingerichtet |
| ESLint | – | – (Lint = Typecheck + Prettier, wie bisher) |
