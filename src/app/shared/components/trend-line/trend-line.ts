import { Component, computed, input } from '@angular/core';
import { CashFlowPoint } from '../../../core/models/velo.model';

@Component({
  selector: 'app-trend-line',
  templateUrl: './trend-line.html',
  styleUrl: './trend-line.css',
})
export class TrendLine {
  readonly points = input.required<CashFlowPoint[]>();

  protected readonly polylinePoints = computed(() => {
    const points = this.points();

    if (points.length === 0) {
      return '';
    }

    const values = points.map((point) => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    return points
      .map((point, index) => {
        const x = (index / Math.max(points.length - 1, 1)) * 100;
        const y = 40 - ((point.value - min) / range) * 32;
        return `${x},${y}`;
      })
      .join(' ');
  });
}
