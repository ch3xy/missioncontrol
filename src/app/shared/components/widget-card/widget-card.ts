import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Dashboard widget on the shared `.card` surface (same look as dash cards). */
@Component({
  selector: 'app-widget-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './widget-card.html',
  styleUrl: './widget-card.scss',
})
export class WidgetCard {
  readonly title = input.required<string>();
  readonly eyebrow = input<string>();
}
