import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { I18nService } from '../../../core/i18n/i18n.service';
import { SourceBadge } from './source-badge';

@Component({
  imports: [SourceBadge],
  template: '<app-source-badge source="local-json" />',
})
class SourceBadgeHost {}

describe('SourceBadge', () => {
  it('should render a readable source label', () => {
    const fixture = TestBed.createComponent(SourceBadgeHost);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Lokales JSON');
  });

  it('should follow the selected language', async () => {
    const fixture = TestBed.createComponent(SourceBadgeHost);
    TestBed.inject(I18nService).setLanguage('en');
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Local JSON');
  });
});
