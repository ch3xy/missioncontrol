import { Injectable, computed, inject } from '@angular/core';
import {
  LucideCalendarDays,
  LucideReceipt,
  LucideServer,
  LucideTimer,
  LucideWallet,
} from '@lucide/angular';
import { AppShortcut } from '../models/shortcut.model';
import { I18nService } from '../i18n/i18n.service';
import { SettingsService } from './settings.service';

@Injectable({ providedIn: 'root' })
export class ShortcutService {
  private readonly settingsService = inject(SettingsService);
  private readonly i18n = inject(I18nService);

  readonly shortcuts = computed<AppShortcut[]>(() => {
    const urls = this.settingsService.externalUrls();
    const t = this.i18n.t.bind(this.i18n);

    const baseShortcuts: AppShortcut[] = [
      {
        id: 'velo',
        label: 'velo',
        description: t('shortcut.velo'),
        url: urls.velo,
        icon: LucideWallet,
        external: true,
      },
      {
        id: 'dash',
        label: 'dash',
        description: t('shortcut.dash'),
        url: urls.dash,
        icon: LucideTimer,
        external: true,
      },
      {
        id: 'sevdesk',
        label: 'sevDesk',
        description: t('shortcut.sevdesk'),
        url: urls.sevdesk,
        icon: LucideReceipt,
        external: true,
      },
      {
        id: 'calendar',
        label: t('nav.calendar'),
        description: t('shortcut.calendar'),
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
        description: t('shortcut.localTool'),
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
