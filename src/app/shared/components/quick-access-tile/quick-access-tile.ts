import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppShortcut } from '../../../core/models/shortcut.model';

@Component({
  selector: 'app-quick-access-tile',
  imports: [RouterLink],
  templateUrl: './quick-access-tile.html',
  styleUrl: './quick-access-tile.css',
})
export class QuickAccessTile {
  readonly shortcut = input.required<AppShortcut>();
  readonly launch = output<AppShortcut>();
}
