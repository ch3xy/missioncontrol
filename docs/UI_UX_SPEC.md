# UI / UX Specification — Visual 3

## Visual Direction

Base implementation on Visual 3:

- Dark, focused workspace
- Left vertical sidebar with icons
- Compact header
- Modular widget grid
- Clear hierarchy
- Developer productivity cockpit feeling

## Layout

Desktop layout:

```text
┌──────────────────────────────────────────────┐
│ Sidebar │ Header                             │
│         ├────────────────────────────────────│
│         │ Dashboard Widget Grid              │
│         │                                    │
│         │ Calendar | Velo Cash Flow | Dash   │
│         │ Customers | Quick Access           │
└──────────────────────────────────────────────┘
```

## Sidebar

Items:

- Overview
- Calendar
- Velo
- Dash
- sevDesk
- Settings

Behavior:

- Internal items use Angular routing
- sevDesk opens configured external URL in a new tab
- Active route is visually highlighted

## Dashboard Widgets

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

Suggested tokens:

```css
--mc-bg: #0d1117;
--mc-surface: #121a28;
--mc-surface-2: #172133;
--mc-border: rgba(255, 255, 255, 0.08);
--mc-text: #e5e7eb;
--mc-muted: #9ca3af;
--mc-blue: #2563eb;
--mc-green: #22c55e;
--mc-red: #ef4444;
--mc-orange: #f97316;
```

## Typography

Use system font stack:

```css
font-family:
  Inter,
  ui-sans-serif,
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  'Segoe UI',
  sans-serif;
```

## Responsiveness

Desktop:

- Sidebar fixed left
- 2–3 column widget grid

Tablet:

- Sidebar remains compact
- Widget grid becomes 2 columns

Mobile:

- Optional for MVP
- Stack widgets vertically
- Sidebar may collapse

## UX Principles

- Dashboard opens immediately
- No blocking empty states
- Mock data should make the product feel complete
- External tools are one click away
- Settings are easy to find
