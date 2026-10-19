import { TranslationKey } from '../i18n/translations';

export type IntegrationStatusKind = 'unconfigured' | 'local-json' | 'api' | 'ics' | 'error';

/** The label is derived from `kind` (`status.<kind>`); `message` is a translation key. */
export interface IntegrationStatus {
  kind: IntegrationStatusKind;
  message: TranslationKey;
  requestedUrl?: string;
}
