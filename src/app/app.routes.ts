import { Routes } from '@angular/router';
import { Shell } from './layout/shell';

/** Route titles are translation keys, resolved by I18nTitleStrategy. */
export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      {
        path: '',
        loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
        title: 'title.dashboard',
      },
      {
        path: 'calendar',
        loadComponent: () =>
          import('./features/calendar/calendar-page').then((m) => m.CalendarPage),
        title: 'title.calendar',
      },
      {
        path: 'velo',
        loadComponent: () => import('./features/velo/velo-page').then((m) => m.VeloPage),
        title: 'title.velo',
      },
      {
        path: 'dash',
        loadComponent: () => import('./features/dash/dash-page').then((m) => m.DashPage),
        title: 'title.dash',
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings-page').then((m) => m.SettingsPage),
        title: 'title.settings',
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
