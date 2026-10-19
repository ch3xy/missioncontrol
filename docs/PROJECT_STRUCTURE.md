# Recommended Project Structure

```text
src/
├── app/
│   ├── app.component.ts
│   ├── app.routes.ts
│   ├── core/
│   │   ├── models/
│   │   │   ├── calendar.model.ts
│   │   │   ├── dash.model.ts
│   │   │   ├── settings.model.ts
│   │   │   ├── shortcut.model.ts
│   │   │   └── velo.model.ts
│   │   ├── services/
│   │   │   ├── settings.service.ts
│   │   │   ├── calendar-adapter.service.ts
│   │   │   ├── velo-adapter.service.ts
│   │   │   ├── dash-adapter.service.ts
│   │   │   ├── shortcut.service.ts
│   │   │   └── theme.service.ts
│   │   └── mock-data/
│   │       ├── calendar.mock.ts
│   │       ├── velo.mock.ts
│   │       └── dash.mock.ts
│   ├── layout/
│   │   ├── shell.component.ts
│   │   ├── sidebar.component.ts
│   │   └── topbar.component.ts
│   ├── features/
│   │   ├── dashboard/
│   │   ├── calendar/
│   │   ├── velo/
│   │   ├── dash/
│   │   └── settings/
│   └── shared/
│       ├── components/
│       │   ├── widget-card/
│       │   ├── trend-line/
│       │   └── quick-access-tile/
│       └── utils/
├── styles.scss          # Arrow design tokens + shared component classes
└── main.ts
```

Logo set and favicons live in `public/` (see `.ai/frontend/design-system.md`).
The current, authoritative structure is documented in `.ai/frontend/architecture.md`.

Codex may adapt this structure to the existing repository if necessary.
