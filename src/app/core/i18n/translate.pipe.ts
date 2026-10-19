import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService, TranslationParams } from './i18n.service';
import { TranslationKey } from './translations';

/**
 * `{{ 'nav.settings' | t }}` / `{{ 'common.updated' | t: { time } }}`.
 * Impure so a language switch re-renders OnPush views; the lookup is a plain object access.
 */
@Pipe({ name: 't', pure: false })
export class TranslatePipe implements PipeTransform {
  private readonly i18n = inject(I18nService);

  transform(key: TranslationKey, params?: TranslationParams): string {
    return this.i18n.t(key, params);
  }
}
