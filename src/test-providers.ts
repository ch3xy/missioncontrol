import { Provider } from '@angular/core';
import { SettingsApi } from './app/core/services/settings-api';
import { InMemorySettingsApi } from './app/testing/in-memory-settings-api';
import { TaskApi } from './app/core/services/task-api';
import { InMemoryTaskApi } from './app/testing/in-memory-task-api';

/** Providers for every unit test (`providersFile` in angular.json). */
const testProviders: Provider[] = [
  { provide: SettingsApi, useClass: InMemorySettingsApi },
  { provide: TaskApi, useClass: InMemoryTaskApi },
];

export default testProviders;
