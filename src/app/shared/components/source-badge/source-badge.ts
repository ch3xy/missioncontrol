import { Component, computed, input } from '@angular/core';
import { CalendarSource } from '../../../core/models/calendar.model';

type DataSource = CalendarSource | 'local-json';

@Component({
  selector: 'app-source-badge',
  templateUrl: './source-badge.html',
  styleUrl: './source-badge.css',
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
}
