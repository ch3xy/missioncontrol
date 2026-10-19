import { Injectable, effect, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { I18nService } from './i18n.service';
import { EN, TranslationKey } from './translations';

/** Route `title` values are translation keys; the document title follows language switches. */
@Injectable()
export class I18nTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly i18n = inject(I18nService);
  private key: TranslationKey = 'title.dashboard';

  constructor() {
    super();
    effect(() => this.title.setTitle(this.i18n.t(this.key)));
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const title = this.buildTitle(snapshot);
    this.key = isTranslationKey(title) ? title : 'title.dashboard';
    this.title.setTitle(this.i18n.t(this.key));
  }
}

function isTranslationKey(value: string | undefined): value is TranslationKey {
  return value !== undefined && value in EN;
}
