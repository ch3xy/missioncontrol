import { Provider } from '@angular/core';
import { SettingsApi } from './app/core/services/settings-api';
import { InMemorySettingsApi } from './app/testing/in-memory-settings-api';

/** Providers for every unit test (`providersFile` in angular.json). */
const testProviders: Provider[] = [{ provide: SettingsApi, useClass: InMemorySettingsApi }];

export default testProviders;
