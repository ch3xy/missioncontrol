# Vergleich velo · dash · mission control

Stand: 2026-10-19. Ziel: Alle drei Arrow-Produkte sollen wie aus einem Guss wirken
(siehe `docs/arrow-corporate-design.md`). velo und dash werden von hier aus **nicht** verändert.

## Zweck

| | velo | dash | mission control |
|---|---|---|---|
| Fachlich | Cashflow-Forecast, Finanzen | Zeiterfassung, Kunden, Projekte, Reports | Cockpit: Kalender, Zusammenfassungen aus velo/dash, Shortcuts |
| Descriptor im Logo | „cash flow“ | „time tracking“ | „cockpit“ |
| Datenhaltung | PostgreSQL | PostgreSQL | LocalStorage + REST-APIs von velo/dash, Local-JSON/ICS |

## Tech-Stack

| Thema | velo | dash | mission control |
|---|---|---|---|
| Backend | Java 25, Spring Boot 4, Flyway | Java 25, Spring Boot 4, Flyway | – (bewusst frontend-only) |
| Angular | 19.2 | 22 | 22 ✅ |
| TypeScript | ~5.7 | ~6.0 | ~6.0 ✅ |
| Komponentenbibliothek | Angular Material (auf Arrow-Tokens gethemed) | keine, eigene Klassen | keine, eigene Klassen (wie dash) ✅ |
| Change Detection | Zone.js | Zoneless + OnPush | Zoneless + OnPush ✅ |
| Styles | SCSS | SCSS | SCSS ✅ (vorher CSS) |
| Icons | Material Symbols | Lucide | Lucide ✅ (vorher Buchstaben) |
| Schrift | Inter (Fontsource) | Inter (Fontsource) | Inter (Fontsource) ✅ |
| Unit-Tests | Karma/Jasmine | Vitest | Vitest ✅ |
| E2E | – | Playwright | – (offen) |
| Formatierung | – | Prettier | Prettier ✅ |

## Design

| Thema | velo | dash | mission control (vorher → jetzt) |
|---|---|---|---|
| Primary | Indigo | Indigo | Blau `#2563eb` → Indigo |
| Neutralfarben | Slate | Slate | eigene Dark-Palette → Slate |
| Theme | Hell/Dunkel/System | Hell/Dunkel/System | nur Dunkel → Hell/Dunkel/System |
| Sidebar | 240/72px, Gruppen, Logo | 240/72px, Gruppen, Logo | 80px-Rail „MC“ → 240/72px, Gruppen, Logo |
| Topbar | 64px | 64px, Theme-Toggle | Titelzeile → 64px, Theme-Toggle |
| Mobile | Drawer ≤ 600px | Drawer ≤ 640px | gestapelt → Drawer ≤ 640px |
| Karten | Material Card im dash-Look | `.card` | eigener Verlauf → `.card` |
| Buttons | Material, 38px | `.btn` 38px | `.button-link` → `.btn` |
| Formulare | Material Form Fields | `.field` / `.input` | eigene Inputs → `.field` / `.input` |
| Badges | – | `.badge.ok/warn/danger/info/muted` | eigene Farben → `.badge` |

## Architektur

| Thema | dash | mission control |
|---|---|---|
| Shell | `app.ts` mit Inline-Template | `layout/shell`, `layout/sidebar`, `layout/topbar` (gleiche Klassen und Maße) |
| Theme-Service | `core/theme.service.ts`, Key `dash-theme` | `core/services/theme.service.ts`, Key `missioncontrol-theme` |
| Sidebar-Status | Key `dash-nav-collapsed` | Key `missioncontrol-nav-collapsed` |
| Routing | Lazy Routes | Lazy Routes unter Shell-Route |
| Datenzugriff | HTTP-Services gegen Backend | typisierte Adapter (REST-API → Local JSON/ICS, keine Mocks) |

## Bewusste Abweichungen

- **Sprache:** wie dash und velo standardmäßig deutsch mit de-AT-Formaten; zusätzlich zur Laufzeit auf Englisch
  umschaltbar (Einstellungen → Sprache / Language). Umgesetzt mit eigenem `I18nService` statt `@angular/localize`.
- **Widget-Grid:** mission control behält sein 12-Spalten-Grid (`.dashboard-grid`, `.span-*`), weil es
  Dashboard-spezifisch ist; die Karten selbst nutzen `.card`.
- **Kein Material:** velo nutzt Material, mission control folgt dem leichteren dash-Ansatz.
