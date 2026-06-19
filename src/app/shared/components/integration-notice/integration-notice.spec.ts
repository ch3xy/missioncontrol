import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { IntegrationNotice } from './integration-notice';

@Component({
  imports: [IntegrationNotice],
  template: `
    <app-integration-notice
      [status]="{
        kind: 'fallback',
        label: 'Mock fallback',
        message: 'Using mock data.',
      }"
    />
  `,
})
class IntegrationNoticeHost {}

describe('IntegrationNotice', () => {
  it('should render fallback notices', () => {
    const fixture = TestBed.createComponent(IntegrationNoticeHost);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Mock fallback');
  });
});
