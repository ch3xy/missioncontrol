import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslationKey } from '../../../core/i18n/translations';
import { CalendarSource } from '../../../core/models/calendar.model';

export type DataSource = CalendarSource | 'local-json' | 'api';

export const SOURCE_LABELS: Record<DataSource, TranslationKey> = {
  api: 'source.api',
  'local-json': 'source.localJson',
  ics: 'source.ics',
  mock: 'source.mock',
};

/** Semantic badge tone: real data → ok, calendar feed → info, mock → muted. */
const SOURCE_TONES: Record<DataSource, string> = {
  api: 'badge ok',
  'local-json': 'badge ok',
  ics: 'badge info',
  mock: 'badge muted',
};

@Component({
  selector: 'app-source-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './source-badge.html',
  styleUrl: './source-badge.scss',
})
export class SourceBadge {
  private readonly i18n = inject(I18nService);

  readonly source = input.required<DataSource>();

  protected readonly label = computed(() => this.i18n.t(SOURCE_LABELS[this.source()]));
  protected readonly tone = computed(() => SOURCE_TONES[this.source()]);
}
