# Frontend-Architektur

Angular 22, Standalone-Komponenten, Zoneless, Signals. Gleiche Grundmuster wie dash
(`dash/.ai/frontend/architecture.md`), aber ohne HTTP-Backend: Daten kommen über typisierte Adapter.

## Projektstruktur

```
src/
├── index.html                 # lang, Titel „mission control“, SVG-Favicon
├── styles.scss                # Arrow-Tokens + globale Komponentenklassen (siehe design-system.md)
└── app/
    ├── app.config.ts          # Zoneless, Router, Lucide-Defaults
    ├── app.routes.ts          # Shell-Route mit Lazy Children
    ├── layout/
    │   ├── shell.*            # Flex-Layout, Skip-Link, Drawer-Backdrop, Collapse-State
    │   ├── sidebar.*          # Logo, Navigationsgruppen, Settings-Footer, Version
    │   └── topbar.*           # Mobile-Menü, Datum, Theme-Toggle
    ├── core/
    │   ├── models/            # typisierte Interfaces (Settings, Shortcut, Calendar, Velo, Dash …)
    │   ├── services/          # Adapter, SettingsService, ShortcutService, ThemeService
    │   └── validators/        # httpUrlValidator
    ├── features/
    │   ├── dashboard/         # Übersicht (Widget-Grid)
    │   ├── calendar/          # Agenda
    │   ├── velo/              # Cashflow-Zusammenfassung
    │   ├── dash/              # Zeit-/Kunden-Zusammenfassung
    │   └── settings/          # URLs, Datenquellen, Darstellung, Backup
    ├── shared/components/     # widget-card, source-badge, integration-notice, quick-access-tile, trend-line
    └── testing/               # createMemoryStorage() für Specs
public/                        # Logo-Set, Favicons, examples/ (Local-JSON/ICS-Beispiele)
```

## Routing

| Pfad | Komponente | Titel |
|---|---|---|
| `/` | `Dashboard` | `mission control` |
| `/calendar` | `CalendarPage` | `Calendar · mission control` |
| `/velo` | `VeloPage` | `velo · mission control` |
| `/dash` | `DashPage` | `dash · mission control` |
| `/settings` | `SettingsPage` | `Settings · mission control` |
| `**` | Redirect auf `/` | |

Alle Feature-Routen sind Children der Shell-Route und werden lazy geladen (`loadComponent`).
sevDesk ist kein Route-Ziel, sondern ein externer Link über `ShortcutService.openExternal()`.

## State

- Lokaler UI-State ausschließlich über `signal()` / `computed()`; Komponenten sind `OnPush`.
- Zoneless: asynchrone Ergebnisse (Adapter-Promises) **immer** in Signals schreiben, nie in Plain-Felder.
- `SettingsService` hält die Einstellungen als Signal und persistiert in LocalStorage.
- `ThemeService` hält `mode` (`light | dark | system`) und das effektive `theme`; setzt `data-theme` auf `<html>`.

## LocalStorage-Schlüssel

| Schlüssel | Inhalt |
|---|---|
| Settings-Key des `SettingsService` | Externe URLs, Datenquellen, lokale Tools |
| `missioncontrol-theme` | `light` / `dark` / `system` |
| `missioncontrol-nav-collapsed` | `true` / `false` |

Jeder Zugriff ist in `try/catch` gekapselt (Private Mode, blockierter Storage).

## Adapter

Externe Integrationen liegen hinter typisierten Adapter-Services (`calendar-adapter`, `velo-adapter`,
`dash-adapter`). Reihenfolge: konfigurierte Quelle (Local JSON / ICS) → bei Fehler Mock-Fallback mit
`IntegrationStatus`. Verträge: `docs/LOCAL_JSON_CONTRACTS.md`. Keine Secrets, keine privaten URLs im Code.

## Tests

- Vitest über `ng test`; Specs liegen neben den Dateien (`*.spec.ts`).
- LocalStorage in Specs mit `vi.stubGlobal('localStorage', createMemoryStorage())` ersetzen.
- `feature-pages.spec.ts` ist der Smoke-Test für alle Seiten.
