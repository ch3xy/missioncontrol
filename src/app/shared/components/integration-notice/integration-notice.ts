import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LucideInfo, LucideTriangleAlert } from '@lucide/angular';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { TranslationKey } from '../../../core/i18n/translations';
import { IntegrationStatus } from '../../../core/models/integration-status.model';

@Component({
  selector: 'app-integration-notice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideInfo, LucideTriangleAlert, TranslatePipe],
  templateUrl: './integration-notice.html',
  styleUrl: './integration-notice.scss',
})
export class IntegrationNotice {
  readonly status = input.required<IntegrationStatus>();

  protected readonly label = computed<TranslationKey>(() => `status.${this.status().kind}`);

  protected readonly isVisible = computed(
    () => this.status().kind !== 'local-json' && this.status().kind !== 'ics',
  );
}
