import { Injectable } from '@angular/core';
import { SettingsApi, SettingsApiResult } from '../core/services/settings-api';
import { DEFAULT_SETTINGS } from '../core/models/settings.model';

/**
 * Unit tests only: answers like the backend from memory, so specs neither need a server nor see
 * the settings requests in their own `fetch` mocks. `available = false` simulates an outage.
 */
@Injectable()
export class InMemorySettingsApi extends SettingsApi {
  stored: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  available = true;
  readonly requests: unknown[] = [];

  override async get(): Promise<SettingsApiResult> {
    return this.available ? { kind: 'ok', payload: { ...this.stored } } : { kind: 'unavailable' };
  }

  override async put(body: unknown): Promise<SettingsApiResult> {
    this.requests.push(body);

    if (!this.available) {
      return { kind: 'unavailable' };
    }

    this.stored = { ...(body as Record<string, unknown>) };
    return { kind: 'ok', payload: { ...this.stored } };
  }
}
