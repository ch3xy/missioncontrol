import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ShortcutService } from '../core/services/shortcut.service';

interface NavItem {
  label: string;
  icon: string;
  route?: string;
  externalKey?: 'sevdesk';
}

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  private readonly shortcutService = inject(ShortcutService);

  protected readonly items: NavItem[] = [
    { label: 'Overview', icon: 'O', route: '/' },
    { label: 'Calendar', icon: 'C', route: '/calendar' },
    { label: 'Velo', icon: 'V', route: '/velo' },
    { label: 'Dash', icon: 'D', route: '/dash' },
    { label: 'sevDesk', icon: 'S', externalKey: 'sevdesk' },
    { label: 'Settings', icon: '*', route: '/settings' },
  ];

  protected openExternal(item: NavItem): void {
    if (item.externalKey !== 'sevdesk') {
      return;
    }

    const shortcut = this.shortcutService
      .shortcuts()
      .find((candidate) => candidate.id === 'sevdesk');
    this.shortcutService.openExternal(shortcut?.url);
  }
}
