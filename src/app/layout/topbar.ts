import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { LucideMenu, LucideMoon, LucideSun } from '@lucide/angular';
import { I18nService } from '../core/i18n/i18n.service';
import { TranslatePipe } from '../core/i18n/translate.pipe';
import { ClockService } from '../core/services/clock.service';
import { ThemeService } from '../core/services/theme.service';

@Component({
  selector: 'app-topbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, LucideMenu, LucideMoon, LucideSun, TranslatePipe],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
})
export class Topbar {
  protected readonly theme = inject(ThemeService);
  protected readonly i18n = inject(I18nService);

  readonly drawerOpen = input(false);
  readonly openMenu = output();

  protected readonly today = inject(ClockService).now;
}
