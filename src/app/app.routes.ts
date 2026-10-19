import { Routes } from '@angular/router';
import { Shell } from './layout/shell';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      {
        path: '',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
        title: 'mission control',
      },
      {
        path: 'calendar',
        loadComponent: () =>
          import('./features/calendar/calendar-page').then((m) => m.CalendarPage),
        title: 'Calendar · mission control',
      },
      {
        path: 'velo',
        loadComponent: () => import('./features/velo/velo-page').then((m) => m.VeloPage),
        title: 'velo · mission control',
      },
      {
        path: 'dash',
        loadComponent: () => import('./features/dash/dash-page').then((m) => m.DashPage),
        title: 'dash · mission control',
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings-page').then((m) => m.SettingsPage),
        title: 'Settings · mission control',
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
