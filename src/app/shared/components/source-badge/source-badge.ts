import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CalendarSource } from '../../../core/models/calendar.model';

type DataSource = CalendarSource | 'local-json';

@Component({
  selector: 'app-source-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './source-badge.html',
  styleUrl: './source-badge.scss',
})
export class SourceBadge {
  readonly source = input.required<DataSource>();

  protected readonly label = computed(() => {
    switch (this.source()) {
      case 'local-json':
        return 'Local JSON';
      case 'ics':
        return 'ICS';
      case 'mock':
        return 'Mock';
    }
  });

  /** Semantic badge tone: real data → ok, calendar feed → info, mock → muted. */
  protected readonly tone = computed(() => {
    switch (this.source()) {
      case 'local-json':
        return 'badge ok';
      case 'ics':
        return 'badge info';
      case 'mock':
        return 'badge muted';
    }
  });
}
