import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LucideInfo, LucideTriangleAlert } from '@lucide/angular';
import { IntegrationStatus } from '../../../core/models/integration-status.model';

@Component({
  selector: 'app-integration-notice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideInfo, LucideTriangleAlert],
  templateUrl: './integration-notice.html',
  styleUrl: './integration-notice.scss',
})
export class IntegrationNotice {
  readonly status = input.required<IntegrationStatus>();

  protected readonly isVisible = computed(
    () => this.status().kind !== 'local-json' && this.status().kind !== 'ics',
  );
}
