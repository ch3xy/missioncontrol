import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { I18nService } from '../../../core/i18n/i18n.service';
import { IntegrationStatus } from '../../../core/models/integration-status.model';
import { IntegrationNotice } from './integration-notice';

@Component({
  imports: [IntegrationNotice],
  template: `<app-integration-notice [status]="status()" />`,
})
class IntegrationNoticeHost {
  readonly status = signal<IntegrationStatus | null>(null);
}

describe('IntegrationNotice', () => {
  function render(status: IntegrationStatus | null): HTMLElement {
    TestBed.inject(I18nService).setLanguage('en');
    const fixture = TestBed.createComponent(IntegrationNoticeHost);
    fixture.componentInstance.status.set(status);
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('should render a warning when a source fails', () => {
    const element = render({ kind: 'error', message: 'status.velo.apiFailed' });

    expect(element.querySelector('.notice--error')).not.toBeNull();
    expect(element.textContent).toContain('Warning');
    expect(element.textContent).toContain('The velo API is not reachable.');
  });

  it('should render a hint when a source is not configured', () => {
    const element = render({ kind: 'unconfigured', message: 'status.velo.unconfigured' });

    expect(element.querySelector('.notice--error')).toBeNull();
    expect(element.textContent).toContain('Not configured');
  });

  it('should stay hidden while loading and after a successful load', () => {
    expect(render(null).querySelector('.notice')).toBeNull();
    expect(
      render({ kind: 'api', message: 'status.velo.apiLoaded' }).querySelector('.notice'),
    ).toBeNull();
  });
});
