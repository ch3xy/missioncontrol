import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router, TitleStrategy, provideRouter } from '@angular/router';
import { createMemoryStorage } from '../../testing/memory-storage';
import { I18nService } from './i18n.service';
import { I18nTitleStrategy } from './i18n-title.strategy';

@Component({ template: '' })
class Blank {}

describe('I18nTitleStrategy', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage());
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'settings', component: Blank, title: 'title.settings' }]),
        { provide: TitleStrategy, useClass: I18nTitleStrategy },
      ],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should translate route titles and follow language switches', async () => {
    await TestBed.inject(Router).navigateByUrl('/settings');
    const title = TestBed.inject(Title);

    expect(title.getTitle()).toBe('Einstellungen · mission control');

    TestBed.inject(I18nService).setLanguage('en');
    TestBed.tick();

    expect(title.getTitle()).toBe('Settings · mission control');
  });
});
