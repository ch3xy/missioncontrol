import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from '../core/services/theme.service';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

const COLLAPSED_KEY = 'missioncontrol-nav-collapsed';

/**
 * App shell following the shared Arrow product layout (docs/arrow-corporate-design.md, section 7):
 * sidebar left, topbar on top, scrolling content.
 * Desktop: 240px sidebar, collapsible to 72px. Mobile (≤ 640px): off-canvas drawer.
 */
@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, Sidebar, Topbar],
  host: { '(document:keydown.escape)': 'drawerOpen.set(false)' },
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  private readonly theme = inject(ThemeService);

  protected readonly collapsed = signal(this.readCollapsed());
  protected readonly drawerOpen = signal(false);

  constructor() {
    this.theme.apply();
  }

  protected toggleCollapsed(): void {
    this.collapsed.update((collapsed) => !collapsed);
    try {
      globalThis.localStorage?.setItem(COLLAPSED_KEY, String(this.collapsed()));
    } catch {
      /* storage unavailable — keep in-memory state only */
    }
  }

  private readCollapsed(): boolean {
    try {
      return globalThis.localStorage?.getItem(COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  }
}
