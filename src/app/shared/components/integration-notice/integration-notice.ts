import { Component, computed, input } from '@angular/core';
import { IntegrationStatus } from '../../../core/models/integration-status.model';

@Component({
  selector: 'app-integration-notice',
  templateUrl: './integration-notice.html',
  styleUrl: './integration-notice.css',
})
export class IntegrationNotice {
  readonly status = input.required<IntegrationStatus>();

  protected readonly isVisible = computed(() => this.status().kind !== 'local-json');
}
