import { TestBed } from '@angular/core/testing';
import { MissionControlSettings } from '../core/models/settings.model';
import { SettingsService } from '../core/services/settings.service';

/** Stores settings through the in-memory backend once the first load is done (saving needs it). */
export async function configureSettings(settings: MissionControlSettings): Promise<void> {
  const service = TestBed.inject(SettingsService);
  await service.whenLoaded();
  const result = await service.updateSettings(settings);

  if (!result.ok) {
    throw new Error(`configureSettings failed: ${JSON.stringify(result)}`);
  }
}
