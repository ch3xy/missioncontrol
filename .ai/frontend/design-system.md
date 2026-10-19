# Design-System

Verbindliche Quelle: [`docs/arrow-corporate-design.md`](../../docs/arrow-corporate-design.md).
Die Umsetzung in `src/styles.scss` verwendet **dieselben Token-Namen und Klassen wie dash**
(`dash/frontend/src/styles.scss`). Neue UI immer zuerst aus diesen Klassen bauen; eigene Styles nur
in Komponenten-SCSS und nur mit Tokens (keine Hex-Werte in Komponenten).

## Tokens

| Gruppe | Tokens |
|---|---|
| Spacing | `--sp-1` 4 · `--sp-2` 8 · `--sp-3` 12 · `--sp-4` 16 · `--sp-5` 24 · `--sp-6` 32 · `--sp-7` 48 |
| Radien | `--radius-sm` 6 · `--radius` 10 · `--radius-lg` 16 |
| Schrift | `--font` (Inter Variable), `--mono`; `--fs-xs` 11 · `--fs-sm` 13 · `--fs-md` 14 · `--fs-lg` 16 · `--fs-xl` 20 · `--fs-2xl` 28 |
| Flächen | `--bg`, `--surface`, `--surface-2`, `--border`, `--hover` |
| Text | `--text`, `--text-muted`, `--text-faint` |
| Marke | `--brand`, `--brand-hover`, `--brand-soft`, `--focus-ring` |
| Semantik | `--ok`, `--warn`, `--danger`, `--info` + jeweils `-bg` |
| Charts | `--chart-main`, `--chart-main-fill` |
| Schatten | `--shadow-sm`, `--shadow`, `--shadow-lg` |

Werte für Hell/Dunkel: siehe `src/styles.scss` bzw. Corporate Design Abschnitt 3–5.
Semantikfarben nur für Status (ok/warn/danger/info), nie zur Dekoration.

## Theme

- `data-theme="light|dark"` auf `<html>`, gesetzt durch `ThemeService.apply()` beim Start der Shell.
- Präferenz in `missioncontrol-theme`; ohne Eintrag gilt `prefers-color-scheme` (Modus „System“).
- Umschalten: Topbar-Button (Sonne/Mond) und Settings-Karte „Appearance“ (Light / Dark / System).

## App-Shell (Corporate Design Abschnitt 7)

| Element | Maß / Verhalten |
|---|---|
| Sidebar | 240px, eingeklappt 72px, Status in `missioncontrol-nav-collapsed` |
| Logo | 48px hoch; `logo-sidebar(-dark).svg`, eingeklappt `sidebar-min(-dark).svg` |
| Collapse-Button | 40px rund, Chevron links/rechts, Icon 20px |
| Gruppen | „Overview“ (Dashboard, Calendar), „Apps“ (velo, dash, sevDesk extern) — Label 10px uppercase |
| Nav-Item | 48px hoch, Radius 10, Icon 20px; aktiv: `--brand-soft` + `--brand` |
| Footer | Settings, gedämpft, direkt unter der Liste |
| Version | `v{version}` aus `package.json`, 11px, ganz unten |
| Topbar | 64px, Datum links, Theme-Toggle rechts (Icon 18px) |
| Content | Padding 24px (mobil 16px) |
| Mobil ≤ 640px | Off-Canvas-Drawer 280px / max. 85vw, Backdrop `rgba(15,23,42,.4)`, Menü-Button, Escape schließt |
| Skip-Link | „Skip to content“ → `#main-content` |

## Komponentenklassen (global)

| Klasse | Verwendung |
|---|---|
| `.page-header`, `.page-controls`, `.page-meta` | Seitenkopf mit `h1`, Beschreibung, Aktionen, „Updated …“ |
| `.dashboard-grid`, `.span-4/6/8/12` | 12-Spalten-Widget-Grid (mission-control-spezifisch) |
| `.card`, `.card-pad`, `.card-title` | Karten; `app-widget-card` rendert diese Klassen |
| `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-danger`, `.btn-sm`, `.btn-icon` | Buttons (38px, mobil 44px) |
| `.field`, `.input`, `.select`, `.textarea`, `.field-error`, `.form-row` | Formulare |
| `.badge.ok/.warn/.danger/.info/.muted` | Status-Badges (z. B. Datenquelle) |
| `.progress` (+ `.ok/.warn/.danger`) | Fortschrittsbalken, Inhalt `<span [style.width.%]>` |
| `.metric` / `.stat-value` | Große Kennzahl, tabellarische Ziffern |
| `.muted`, `.faint`, `.mono`, `.row`, `.row-between`, `.text-error`, `.state` | Utilities |

## Icons

Lucide über `@lucide/angular`; global `size 16`, `strokeWidth 1.75`. Größen: 16 Standard, 18 Topbar,
20 Sidebar/Tiles. Statisch: `<svg lucideRefreshCw></svg>`; dynamisch: `<svg [lucideIcon]="icon"></svg>`
mit `LucideDynamicIcon` und Typ `LucideIcon`.

| Kontext | Icon |
|---|---|
| Dashboard | `LucideLayoutDashboard` |
| Calendar | `LucideCalendarDays` |
| velo | `LucideWallet` |
| dash | `LucideTimer` |
| sevDesk | `LucideReceipt` |
| Lokale Tools | `LucideServer` |
| Settings | `LucideSettings` |
| Extern öffnen | `LucideExternalLink` |
| Aktualisieren | `LucideRefreshCw` |
| Speichern / Zurücksetzen | `LucideSave` / `LucideRotateCcw` |
| Export / Import | `LucideDownload` / `LucideUpload` |
| Hinweis / Warnung | `LucideInfo` / `LucideTriangleAlert` |
| Theme | `LucideSun` / `LucideMoon` |
| Menü / Collapse | `LucideMenu` / `LucideChevronLeft` / `LucideChevronRight` |

## Shared Components

| Komponente | Darstellung |
|---|---|
| `app-widget-card` | `.card.card-pad`, `eyebrow` als `.card-title`, Titel `h2` 16px |
| `app-source-badge` | `.badge` — API / Local JSON → `ok`, ICS → `info` |
| `app-integration-notice` | nur bei Problemen sichtbar: `error` → `--warn-bg` + Warn-Icon, `unconfigured` → `--info-bg` + Info-Icon |
| `app-quick-access-tile` | Kachel mit Icon-Box (`--brand-soft`), extern mit External-Link-Icon |
| `app-trend-line` | SVG-Polyline in `--chart-main` |

## Accessibility & Motion

- Fokus: `:focus-visible` 2px `--focus-ring` (Dunkel `#93C5FD`).
- Touch-Ziele mobil ≥ 44px; Inputs mobil 16px (kein iOS-Zoom).
- `prefers-reduced-motion`: Transitions/Animationen aus.
- Produktnamen klein: „mission control“, „velo“, „dash“ (sevDesk bleibt Fremdmarke).
