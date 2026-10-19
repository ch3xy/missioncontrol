import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideDynamicIcon, LucideExternalLink } from '@lucide/angular';
import { RouterLink } from '@angular/router';
import { AppShortcut } from '../../../core/models/shortcut.model';

@Component({
  selector: 'app-quick-access-tile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LucideDynamicIcon, LucideExternalLink],
  templateUrl: './quick-access-tile.html',
  styleUrl: './quick-access-tile.scss',
})
export class QuickAccessTile {
  readonly shortcut = input.required<AppShortcut>();
  readonly launch = output<AppShortcut>();
}
