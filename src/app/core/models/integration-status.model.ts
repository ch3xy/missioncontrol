export type IntegrationStatusKind = 'mock' | 'local-json' | 'ics' | 'fallback';

export interface IntegrationStatus {
  kind: IntegrationStatusKind;
  label: string;
  message: string;
  requestedUrl?: string;
}

export const MOCK_STATUS: IntegrationStatus = {
  kind: 'mock',
  label: 'Mock data',
  message: 'Using built-in mock data.',
};
