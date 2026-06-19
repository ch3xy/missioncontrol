import { Component, input } from '@angular/core';

@Component({
  selector: 'app-widget-card',
  templateUrl: './widget-card.html',
  styleUrl: './widget-card.css',
})
export class WidgetCard {
  readonly title = input.required<string>();
  readonly eyebrow = input<string>();
  readonly accent = input<'blue' | 'green' | 'red' | 'orange'>('blue');
}
