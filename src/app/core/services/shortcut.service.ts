import { Injectable, computed, inject } from '@angular/core';
import { AppShortcut } from '../models/shortcut.model';
import { SettingsService } from './settings.service';

@Injectable({ providedIn: 'root' })
export class ShortcutService {
  private readonly settingsService = inject(SettingsService);

  readonly shortcuts = computed<AppShortcut[]>(() => {
    const urls = this.settingsService.externalUrls();

    return [
      {
        id: 'velo',
        label: 'Velo',
        description: 'Cash flow and forecast',
        url: urls.velo,
        icon: 'V',
        external: true,
      },
      {
        id: 'dash',
        label: 'Dash',
        description: 'Time and customer management',
        url: urls.dash,
        icon: 'D',
        external: true,
      },
      {
        id: 'sevdesk',
        label: 'sevDesk',
        description: 'Accounting workspace',
        url: urls.sevdesk,
        icon: 'S',
        external: true,
      },
      {
        id: 'calendar',
        label: 'Calendar',
        description: 'Appointments and focus blocks',
        route: '/calendar',
        icon: 'C',
        external: false,
      },
    ];
  });

  canOpenUrl(url: string | undefined): url is string {
    if (!url) {
      return false;
    }

    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  openExternal(url: string | undefined): boolean {
    if (!this.canOpenUrl(url)) {
      return false;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  }
}
