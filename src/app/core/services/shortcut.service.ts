import { Injectable, computed, inject } from '@angular/core';
import {
  LucideCalendarDays,
  LucideReceipt,
  LucideServer,
  LucideTimer,
  LucideWallet,
} from '@lucide/angular';
import { AppShortcut } from '../models/shortcut.model';
import { SettingsService } from './settings.service';

@Injectable({ providedIn: 'root' })
export class ShortcutService {
  private readonly settingsService = inject(SettingsService);

  readonly shortcuts = computed<AppShortcut[]>(() => {
    const urls = this.settingsService.externalUrls();

    const baseShortcuts: AppShortcut[] = [
      {
        id: 'velo',
        label: 'velo',
        description: 'Cash flow and forecast',
        url: urls.velo,
        icon: LucideWallet,
        external: true,
      },
      {
        id: 'dash',
        label: 'dash',
        description: 'Time and customer management',
        url: urls.dash,
        icon: LucideTimer,
        external: true,
      },
      {
        id: 'sevdesk',
        label: 'sevDesk',
        description: 'Accounting workspace',
        url: urls.sevdesk,
        icon: LucideReceipt,
        external: true,
      },
      {
        id: 'calendar',
        label: 'Calendar',
        description: 'Appointments and focus blocks',
        route: '/calendar',
        icon: LucideCalendarDays,
        external: false,
      },
    ];

    const localShortcuts: AppShortcut[] = this.settingsService
      .localTools()
      .filter((tool) => this.canOpenUrl(tool.url))
      .map((tool) => ({
        id: tool.id,
        label: tool.label,
        description: 'Configurable local network shortcut',
        url: tool.url,
        icon: LucideServer,
        external: true,
      }));

    return [...baseShortcuts, ...localShortcuts];
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
