# UI / UX Specification — Visual 3

## Visual Direction

Visual 3 layout (sidebar, compact header, widget grid) rendered in the shared **Arrow product design**
used by velo and dash. Binding sources:

- `docs/arrow-corporate-design.md` (copy; master lives in dash)
- `.ai/frontend/design-system.md` (tokens, shell measurements, component classes, icons)

Principles:

- Light, dark and system theme (`missioncontrol-theme`), toggle in the top bar and in Settings → Appearance
- Left sidebar with logo, grouped navigation and Lucide icons
- Compact 64px top bar
- Modular widget grid on shared `.card` surfaces
- Clear hierarchy, developer productivity cockpit feeling

## Layout

Desktop layout:

```text
┌──────────────────────────────────────────────┐
│ Sidebar │ Header                             │
│         ├────────────────────────────────────│
│         │ Dashboard Widget Grid              │
│         │                                    │
│         │ Daily plan (8) | Calendar (4)      │
│         │ Velo Cash Flow | Dash Time         │
│         │ Customers | Quick Access           │
└──────────────────────────────────────────────┘
```

## Sidebar

Groups and items:

- Overview: Dashboard, Calendar
- Apps: velo, dash, sevDesk (external)
- Footer: Settings
- Bottom: version `v{version}`

Behavior:

- 240px wide, collapsible to 72px (`missioncontrol-nav-collapsed`)
- Mobile (≤ 640px): off-canvas drawer with backdrop, opened from the top-bar menu button, closed by Escape
- Internal items use Angular routing
- sevDesk opens configured external URL in a new tab
- Active route is visually highlighted

## Dashboard Widgets

### Daily Plan Widget (central)

Top left, 8 of 12 columns: the most important widget, above pipeline and quick access. Mini version of the page „Heute“ (`/today`); everything else (estimates, editing, ordering, board) stays there.

Shows:

- Quick capture field: Enter or „Add“ puts the task into today, the inbox button into the brain dump
- „x of y tasks done“, capacity bar (planned vs. available, appointments deducted) and figures
- Up to 6 tasks, in progress first, then open, then done (a mistaken tick can be undone); „+n more“ for the rest
- Per task: check button (done / reopen), start button for open tasks, estimate if set
- Hint „n open from earlier days“ with „Take over all“; brain dump count; link „Open daily plan“
- The notice of the plan page when the backend is unreachable (one alert at a time; inputs locked)

### Calendar Widget

Shows:

- Today’s next appointments
- Time
- Title
- Optional project/customer

### Velo Widget

Shows:

- Current or forecast cash flow
- Simple trend line
- Forecast period label

### Dash Time Widget

Shows:

- Time tracked today
- Daily target progress
- Link to Dash

### Dash Customers Widget

Shows:

- Active customers
- Open projects
- Link to customer management

### Quick Access Widget

Shows tiles:

- Velo
- Dash
- sevDesk
- Calendar

## Colors

Arrow tokens from `src/styles.scss` (identical names and values to dash):

- Primary Indigo: `--brand` (`#4F46E5` light / `#6366F1` dark), `--brand-soft`, `--brand-hover`
- Slate neutrals: `--bg`, `--surface`, `--surface-2`, `--border`, `--text`, `--text-muted`, `--text-faint`
- Semantic status only: `--ok`, `--warn`, `--danger`, `--info` with `-bg` variants
- Charts: `--chart-main`

## Typography

Inter Variable, self-hosted through `@fontsource-variable/inter` (no font CDN). Sizes via `--fs-*` tokens.

## Responsiveness

Desktop:

- Sidebar 240px (collapsible to 72px)
- 12-column widget grid: daily plan 8 + calendar 4, velo 6 + dash time 6, customers 6 + quick access 6

Tablet (≤ 1080px):

- Widget grid becomes 2 columns

Mobile (≤ 760px / ≤ 640px):

- Widgets stack vertically
- Sidebar becomes an off-canvas drawer (≤ 640px)
- Touch targets at least 44px

## UX Principles

- Dashboard opens immediately
- No blocking empty states
- Mock data should make the product feel complete
- External tools are one click away
- Settings are easy to find
