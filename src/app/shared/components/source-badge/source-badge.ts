import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';
import { CalendarSource } from '../../../core/models/calendar.model';

type DataSource = CalendarSource | 'local-json';

@Component({
  selector: 'app-source-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './source-badge.html',
  styleUrl: './source-badge.scss',
})
export class SourceBadge {
  private readonly i18n = inject(I18nService);

  readonly source = input.required<DataSource>();

  protected readonly label = computed(() => {
    switch (this.source()) {
      case 'local-json':
        return this.i18n.t('source.localJson');
      case 'ics':
        return this.i18n.t('source.ics');
      case 'mock':
        return this.i18n.t('source.mock');
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
