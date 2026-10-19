# Coding-Standards (Frontend)

Ergänzt `AGENTS.md`. Entspricht dem Frontend-Teil von `dash/.ai/rules/coding-standards.md`.

## TypeScript

- `strict` und `strictTemplates`; kein `any` — stattdessen Interfaces/Union-Types in `core/models`.
- `inject()` statt Konstruktor-Injection.
- Konstanten für Storage-Keys exportieren (z. B. `THEME_STORAGE_KEY`), keine Magic Strings verstreuen.

## Komponenten

- Standalone, `changeDetection: ChangeDetectionStrategy.OnPush` (Schematic ist so konfiguriert).
- Signal-Inputs/-Outputs: `input()`, `input.required()`, `output()`.
- Control Flow: `@if`, `@for` (mit `track`), `@switch` — keine `*ngIf`/`*ngFor`.
- Template, Styles und Klasse getrennt (`.html`, `.scss`, `.ts`); Komponenten klein halten.
- Zustand in Signals; Zoneless erfordert, dass asynchrone Ergebnisse in Signals landen.
- Lucide-Icons einzeln importieren (Tree-Shaking), keine Icon-Fonts, keine Unicode-Glyphen als Icons.

## Styles

- Nur Tokens aus `src/styles.scss` (`var(--…)`), keine Hex-Farben in Komponenten.
- Erst globale Klassen (`.card`, `.btn`, `.field`, `.badge` …) nutzen, dann ergänzen.
- Komponenten-Styles unter 8 kB (Budget-Warnung), Breakpoints 1080 / 760 / 640px.

## Integrationen & Sicherheit

- Externe Apps nur über typisierte Adapter und konfigurierbare URLs (Settings).
- Keine Secrets, Tokens, Passwörter oder privaten URLs im Code oder in Beispieldateien.
- Defaults: velo `http://localhost:4201`, dash `http://localhost:4202`, sevDesk `https://my.sevdesk.de`.

## Tests & Checks

- Vor Abschluss: `npm run lint`, `npm run test -- --watch=false`, `npm run build` (unter `nvm use`).
- Specs neben dem Code; LocalStorage über `createMemoryStorage()` stubben.
- Formatierung ausschließlich über Prettier (`npm run format`).

## Dokumentation

- Annahmen in `docs/ASSUMPTIONS.md`.
- Design-Änderungen in `.ai/frontend/design-system.md`; Corporate-Design-Änderungen gehören ins
  Master-Dokument in dash.
