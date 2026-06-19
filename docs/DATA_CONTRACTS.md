# Data Contracts

Use these TypeScript models as guidance.

## Calendar

```ts
export interface CalendarEvent {
  id: string;
  title: string;
  startsAt: string;
  endsAt?: string;
  project?: string;
  customer?: string;
  location?: string;
  source: 'mock' | 'ics' | 'local-json';
}
```

## Velo

```ts
export interface CashFlowPoint {
  date: string;
  value: number;
}

export interface VeloSummary {
  currentCashFlow: number;
  forecastCashFlow: number;
  currency: 'EUR';
  periodLabel: string;
  trend: CashFlowPoint[];
  source: 'mock' | 'local-json';
}
```

## Dash

```ts
export interface DashSummary {
  trackedTodayMinutes: number;
  targetTodayMinutes: number;
  activeCustomers: number;
  openProjects: number;
  source: 'mock' | 'local-json';
}
```

## Shortcuts

```ts
export interface AppShortcut {
  id: 'velo' | 'dash' | 'sevdesk' | 'calendar';
  label: string;
  description: string;
  url?: string;
  route?: string;
  icon: string;
  external: boolean;
}
```

## Settings

```ts
export interface MissionControlSettings {
  veloUrl: string;
  dashUrl: string;
  sevDeskUrl: string;
  calendarSource: 'mock' | 'ics' | 'local-json';
  calendarSourceUrl?: string;
  veloSourceUrl?: string;
  dashSourceUrl?: string;
}
```

## Adapter Interfaces

```ts
export interface CalendarAdapter {
  getEvents(): Promise<CalendarEvent[]>;
}

export interface VeloAdapter {
  getSummary(): Promise<VeloSummary>;
}

export interface DashAdapter {
  getSummary(): Promise<DashSummary>;
}
```
