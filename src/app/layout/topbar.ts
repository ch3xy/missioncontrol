import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { LucideMenu, LucideMoon, LucideSun } from '@lucide/angular';
import { ThemeService } from '../core/services/theme.service';

@Component({
  selector: 'app-topbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, LucideMenu, LucideMoon, LucideSun],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
})
export class Topbar {
  protected readonly theme = inject(ThemeService);
  private readonly now = signal(new Date());

  readonly drawerOpen = input(false);
  readonly openMenu = output();

  protected readonly today = computed(() => this.now());
}
