# Frontend-Architektur

Angular 22, Standalone-Komponenten, Zoneless, Signals. Gleiche Grundmuster wie dash
(`dash/.ai/frontend/architecture.md`), aber ohne HTTP-Backend: Daten kommen über typisierte Adapter.

## Projektstruktur

```
src/
├── index.html                 # lang="de", Titel „mission control“, SVG-Favicon
├── styles.scss                # Arrow-Tokens + globale Komponentenklassen (siehe design-system.md)
└── app/
    ├── app.config.ts          # Zoneless, Router, I18nTitleStrategy, Lucide-Defaults
    ├── app.routes.ts          # Shell-Route mit Lazy Children, Titel als Übersetzungs-Keys
    ├── layout/
    │   ├── shell.*            # Flex-Layout, Skip-Link, Drawer-Backdrop, Collapse-State
    │   ├── sidebar.*          # Logo, Navigationsgruppen, Settings-Footer, Version
    │   └── topbar.*           # Mobile-Menü, Datum, Theme-Toggle
    ├── core/
    │   ├── i18n/              # I18nService, Wörterbücher DE/EN, `t`-Pipe, I18nTitleStrategy
    │   ├── models/            # typisierte Interfaces (Settings, Shortcut, Calendar, Velo, Dash …)
    │   ├── services/          # Adapter, SettingsService, ShortcutService, ThemeService
    │   └── validators/        # httpUrlValidator
    ├── features/
    │   ├── dashboard/         # Übersicht (Widget-Grid)
    │   ├── calendar/          # Agenda
    │   ├── velo/              # Cashflow-Zusammenfassung
    │   ├── dash/              # Zeit-/Kunden-Zusammenfassung
    │   └── settings/          # URLs, Datenquellen, Sprache, Darstellung, Backup
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
- `I18nService` hält `lang` (`de | en`, Standard `de`) und `locale` (`de-AT | en-US`); setzt `lang` auf `<html>`.

## Mehrsprachigkeit

- Alle UI-Texte stehen in `core/i18n/translations.ts`: `EN` definiert die Keys, `DE` muss jeden Key liefern
  (Typ `Dictionary`). Platzhalter als `{name}`.
- Templates: `{{ 'nav.settings' | t }}` bzw. `{{ 'common.updated' | t: { time } }}` (Pipe ist impure, damit
  OnPush-Views beim Umschalten neu rendern). In `computed()`/Services: `i18n.t(key, params)`.
- Datums-, Zahlen- und Währungs-Pipes bekommen `i18n.locale()` übergeben; Datumsmuster sind selbst Keys
  (`format.*`).
- Services speichern Keys statt fertiger Texte, z. B. `IntegrationStatus.message`; das Label leitet sich aus
  `kind` ab (`status.<kind>`).
- Route-Titel sind Keys; `I18nTitleStrategy` übersetzt sie und folgt dem Sprachwechsel.
- Daten (Termine, Kunden, `periodLabel`, Tool-Bezeichnungen) werden nicht übersetzt.

## LocalStorage-Schlüssel

| Schlüssel | Inhalt |
|---|---|
| Settings-Key des `SettingsService` | Externe URLs, Datenquellen, lokale Tools |
| `missioncontrol-theme` | `light` / `dark` / `system` |
| `missioncontrol-nav-collapsed` | `true` / `false` |
| `missioncontrol-lang` | `de` / `en` |

Jeder Zugriff ist in `try/catch` gekapselt (Private Mode, blockierter Storage).

## Adapter

Externe Integrationen liegen hinter typisierten Adapter-Services (`calendar-adapter`, `velo-adapter`,
`dash-adapter`). Reihenfolge: REST-API von velo/dash (`velo-api.ts`, `dash-api.ts`, nur lesend) →
Local JSON / ICS → Mock-Fallback mit `IntegrationStatus`. Verträge: `docs/LOCAL_JSON_CONTRACTS.md`. Keine Secrets, keine privaten URLs im Code.

API-URLs sind die Basis-URLs der Apps (`https://arrow.local/velo`). Auf dem Server liegen alle Apps hinter
Caddy auf einem Host (same-origin, kein CORS); im Dev-Server spiegelt `proxy.conf.mjs` das
(`/velo/api`, `/dash/api`, Ziele über `VELO_API_TARGET` / `DASH_API_TARGET`). Die API-Typen in
`velo-api.ts` / `dash-api.ts` bilden nur die genutzten Felder der Java-DTOs ab (`AccountTO`,
`ForecastResultTO`, `DashboardResponse`); bei DTO-Änderungen in velo/dash dort und in
`api-adapters.spec.ts` nachziehen.

## Tests

- Vitest über `ng test`; Specs liegen neben den Dateien (`*.spec.ts`).
- LocalStorage in Specs mit `vi.stubGlobal('localStorage', createMemoryStorage())` ersetzen.
- `feature-pages.spec.ts` ist der Smoke-Test für alle Seiten.
