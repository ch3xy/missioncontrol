import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
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
import { version } from '../../../package.json';
import { ShortcutService } from '../core/services/shortcut.service';
import { ThemeService } from '../core/services/theme.service';

interface NavItem {
  label: string;
  icon: LucideIcon;
  route?: string;
  externalKey?: 'sevdesk';
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    RouterLinkActive,
    LucideDynamicIcon,
    LucideChevronLeft,
    LucideChevronRight,
    LucideExternalLink,
    LucideSettings,
  ],
  host: { '[style.display]': '"contents"' },
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  private readonly shortcutService = inject(ShortcutService);
  protected readonly theme = inject(ThemeService);

  readonly collapsed = input(false);
  readonly open = input(false);
  readonly toggleCollapsed = output();
  readonly navigate = output();

  protected readonly version = version;
  protected readonly groups: NavGroup[] = [
    {
      label: 'Overview',
      items: [
        { label: 'Dashboard', icon: LucideLayoutDashboard, route: '/' },
        { label: 'Calendar', icon: LucideCalendarDays, route: '/calendar' },
      ],
    },
    {
      label: 'Apps',
      items: [
        { label: 'velo', icon: LucideWallet, route: '/velo' },
        { label: 'dash', icon: LucideTimer, route: '/dash' },
        { label: 'sevDesk', icon: LucideReceipt, externalKey: 'sevdesk' },
      ],
    },
  ];

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
