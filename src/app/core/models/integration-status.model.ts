import { TranslationKey } from '../i18n/translations';

export type IntegrationStatusKind = 'mock' | 'local-json' | 'ics' | 'fallback';

/** The label is derived from `kind` (`status.<kind>`); `message` is a translation key. */
export interface IntegrationStatus {
  kind: IntegrationStatusKind;
  message: TranslationKey;
  requestedUrl?: string;
}

export const MOCK_STATUS: IntegrationStatus = {
  kind: 'mock',
  message: 'status.mockMessage',
};
