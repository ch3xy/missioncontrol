import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { I18nService } from '../../../core/i18n/i18n.service';
import { IntegrationNotice } from './integration-notice';

@Component({
  imports: [IntegrationNotice],
  template: `
    <app-integration-notice
      [status]="{
        kind: 'fallback',
        message: 'status.mockMessage',
      }"
    />
  `,
})
class IntegrationNoticeHost {}

describe('IntegrationNotice', () => {
  it('should render fallback notices', () => {
    TestBed.inject(I18nService).setLanguage('en');
    const fixture = TestBed.createComponent(IntegrationNoticeHost);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Mock fallback');
    expect(fixture.nativeElement.textContent).toContain('Using built-in mock data.');
  });
});
