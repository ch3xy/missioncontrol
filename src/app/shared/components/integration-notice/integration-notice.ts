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
  /** `null` while the source is still loading. */
  readonly status = input.required<IntegrationStatus | null>();

  /** Only problems are shown; loaded sources are indicated by the source badge. */
  protected readonly visibleStatus = computed(() => {
    const status = this.status();
    return status?.kind === 'unconfigured' || status?.kind === 'error' ? status : null;
  });

  protected readonly label = computed<TranslationKey | null>(() => {
    const status = this.visibleStatus();
    return status ? `status.${status.kind}` : null;
  });
}
