import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideCalendarDays,
  LucideChevronLeft,
  LucideChevronRight,
  LucideDynamicIcon,
  LucideExternalLink,
  LucideIcon,
  LucideLayoutDashboard,
  LucideReceipt,
  LucideSettings,
  LucideTimer,
  LucideWallet,
} from '@lucide/angular';
import { DatePipe } from '@angular/common';
import { BUILD_INFO } from '../core/build-info';
import { I18nService } from '../core/i18n/i18n.service';
import { TranslatePipe } from '../core/i18n/translate.pipe';
import { ShortcutService } from '../core/services/shortcut.service';
import { ThemeService } from '../core/services/theme.service';

interface NavItem {
  label: string;
  icon: LucideIcon;
  route?: string;
  externalKey?: 'sevdesk';
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    RouterLink,
    RouterLinkActive,
    LucideDynamicIcon,
    LucideChevronLeft,
    LucideChevronRight,
    LucideExternalLink,
    LucideSettings,
    TranslatePipe,
  ],
  host: { '[style.display]': '"contents"' },
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  private readonly shortcutService = inject(ShortcutService);
  protected readonly i18n = inject(I18nService);
  protected readonly theme = inject(ThemeService);

  readonly collapsed = input(false);
  readonly open = input(false);
  readonly toggleCollapsed = output();
  readonly navigate = output();

  protected readonly build = BUILD_INFO;
  protected readonly groups = computed<NavGroup[]>(() => [
    {
      id: 'overview',
      label: this.i18n.t('nav.group.overview'),
      items: [
        { label: this.i18n.t('nav.dashboard'), icon: LucideLayoutDashboard, route: '/' },
        { label: this.i18n.t('nav.calendar'), icon: LucideCalendarDays, route: '/calendar' },
      ],
    },
    {
      id: 'apps',
      label: this.i18n.t('nav.group.apps'),
      items: [
        { label: 'velo', icon: LucideWallet, route: '/velo' },
        { label: 'dash', icon: LucideTimer, route: '/dash' },
        { label: 'sevDesk', icon: LucideReceipt, externalKey: 'sevdesk' },
      ],
    },
  ]);

  protected openExternal(item: NavItem): void {
    if (item.externalKey !== 'sevdesk') {
      return;
    }

    const shortcut = this.shortcutService
      .shortcuts()
      .find((candidate) => candidate.id === 'sevdesk');
    this.shortcutService.openExternal(shortcut?.url);
    this.navigate.emit();
  }
}
