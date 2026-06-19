import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
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

    expect(fixture.nativeElement.textContent).toContain('Local JSON');
  });
});
