import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { LucideTriangleAlert } from '@lucide/angular';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { SettingsService } from '../../../core/services/settings.service';

/** Shows that the settings are still loading or that the backend could not be reached. */
@Component({
  selector: 'app-settings-status-notice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideTriangleAlert, TranslatePipe],
  templateUrl: './settings-status-notice.html',
  styleUrl: './settings-status-notice.scss',
})
export class SettingsStatusNotice {
  private readonly settingsService = inject(SettingsService);

  protected readonly status = this.settingsService.status;
  /** Emits after a successful or failed reload, so a page can refresh its view. */
  readonly reloaded = output();

  protected async retry(): Promise<void> {
    await this.settingsService.reload();
    this.reloaded.emit();
  }
}
