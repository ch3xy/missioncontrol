import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideDownload, LucideRotateCcw, LucideSave, LucideUpload } from '@lucide/angular';
import { I18nService, LANGUAGE_LABELS, LANGUAGES } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { TranslationKey } from '../../core/i18n/translations';
import { AppShortcut } from '../../core/models/shortcut.model';
import {
  AUTO_REFRESH_MINUTES,
  AutoRefreshMinutes,
  MissionControlSettings,
} from '../../core/models/settings.model';
import { ShortcutService } from '../../core/services/shortcut.service';
import { SaveResult, SettingsService } from '../../core/services/settings.service';
import { THEME_MODE_LABELS, ThemeMode, ThemeService } from '../../core/services/theme.service';
import { httpUrlValidator } from '../../core/validators/http-url.validator';
import { sourceUrlsValidator } from '../../core/validators/source-urls.validator';
import { SettingsStatusNotice } from '../../shared/components/settings-status-notice/settings-status-notice';
import { QuickAccessTile } from '../../shared/components/quick-access-tile/quick-access-tile';
import { WidgetCard } from '../../shared/components/widget-card/widget-card';

/** Resolved against <base href>, so the presets also work when the app is served under /missioncontrol/. */
const bundledExample = (file: string): string => new URL(`examples/${file}`, document.baseURI).href;

@Component({
  selector: 'app-settings-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    QuickAccessTile,
    SettingsStatusNotice,
    WidgetCard,
    LucideDownload,
    LucideRotateCcw,
    LucideSave,
    LucideUpload,
    TranslatePipe,
  ],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.scss',
})
export class SettingsPage {
  protected readonly i18n = inject(I18nService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly settingsService = inject(SettingsService);
  private readonly shortcutService = inject(ShortcutService);
  protected readonly theme = inject(ThemeService);

  protected readonly themeModes: ThemeMode[] = ['light', 'dark', 'system'];
  protected readonly themeLabels = THEME_MODE_LABELS;
  protected readonly languages = LANGUAGES;
  protected readonly languageLabels = LANGUAGE_LABELS;
  protected readonly autoRefreshOptions = AUTO_REFRESH_MINUTES;

  protected readonly savedSettings = this.settingsService.settings;
  protected readonly status = this.settingsService.status;
  protected readonly saving = signal(false);
  /** Outcome of the last save, reset, import or preset. */
  protected readonly saveResult = signal<SaveResult | null>(null);
  /**
   * Inputs and actions only work with loaded settings and no pending save: edits before the first
   * answer would be overwritten by it, and edits during a save by its result.
   */
  protected readonly editable = computed(() => this.status() === 'ready' && !this.saving());
  protected readonly shortcuts = this.shortcutService.shortcuts;
  /** Label of the shortcut that could not be opened. */
  protected readonly launchError = signal<string | null>(null);
  protected readonly backupMessage = signal<TranslationKey | null>(null);
  protected readonly savedMessage = computed(() => {
    const settings = this.savedSettings();
    return this.i18n.t('settings.savedMessage', {
      velo: settings.veloUrl,
      dash: settings.dashUrl,
      sevdesk: settings.sevDeskUrl,
    });
  });
  protected readonly sourceHint = computed(() => {
    const settings = this.savedSettings();

    if (settings.calendarSource === 'none') {
      return this.i18n.t('settings.hint.none');
    }

    if (settings.calendarSource === 'ics') {
      return this.i18n.t('settings.hint.ics');
    }

    return this.i18n.t('settings.hint.localJson');
  });

  protected readonly form = this.formBuilder.nonNullable.group({
    veloUrl: ['', [Validators.required, httpUrlValidator()]],
    dashUrl: ['', [Validators.required, httpUrlValidator()]],
    sevDeskUrl: ['', [Validators.required, httpUrlValidator()]],
    calendarSource: ['none' as MissionControlSettings['calendarSource']],
    calendarSourceUrl: ['', [sourceUrlsValidator()]],
    veloSourceUrl: ['', [httpUrlValidator({ optional: true })]],
    dashSourceUrl: ['', [httpUrlValidator({ optional: true })]],
    veloApiUrl: ['', [httpUrlValidator({ optional: true })]],
    dashApiUrl: ['', [httpUrlValidator({ optional: true })]],
    // At most two decimals, as stored by the backend
    dailyTargetHours: [
      8,
      [
        Validators.required,
        Validators.min(0.5),
        Validators.max(24),
        Validators.pattern(/^\d+(\.\d{1,2})?$/),
      ],
    ],
    autoRefreshMinutes: [5 as AutoRefreshMinutes],
    localTool1Label: ['Local Tool 1', [Validators.required]],
    localTool1Url: ['', [httpUrlValidator({ optional: true })]],
    localTool2Label: ['Local Tool 2', [Validators.required]],
    localTool2Url: ['', [httpUrlValidator({ optional: true })]],
  });

  constructor() {
    this.form.patchValue(this.savedSettings());
    effect(() => {
      if (this.editable()) {
        this.form.enable({ emitEvent: false });
      } else {
        this.form.disable({ emitEvent: false });
      }
    });
    // The backend answers after the first render; the form is disabled until then
    void this.settingsService.whenLoaded().then(() => this.form.reset(this.savedSettings()));
  }

  protected async save(): Promise<void> {
    if (!this.editable() || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    await this.persist(() => this.settingsService.updateSettings(this.form.getRawValue()));
  }

  protected async reset(): Promise<void> {
    await this.persist(() => this.settingsService.resetSettings());
  }

  protected exportSettings(): void {
    // Without loaded settings the export would only contain the defaults
    if (this.status() !== 'ready') {
      return;
    }

    const blob = new Blob([this.settingsService.exportSettings()], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mission-control-settings.json';
    link.click();
    // Some browsers start the download asynchronously; revoking at once can cancel it
    setTimeout(() => URL.revokeObjectURL(url), 1_000);
    this.backupMessage.set('settings.exported');
  }

  protected importSettings(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file || !this.editable()) {
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      input.value = '';
      this.backupMessage.set(null);
      this.saveResult.set(null);
      this.saving.set(true);
      const result = await this.settingsService.importSettings(String(reader.result ?? ''));
      this.saving.set(false);

      if (!result) {
        this.backupMessage.set('settings.importFailed');
        return;
      }

      this.saveResult.set(result);
      await this.syncForm(result);

      if (result.ok) {
        this.backupMessage.set('settings.imported');
      }
    };
    reader.onerror = () => {
      this.backupMessage.set('settings.importFailed');
      input.value = '';
    };
    reader.readAsText(file);
  }

  protected useBundledJsonExamples(): void {
    void this.applyAndSave({
      calendarSource: 'local-json',
      calendarSourceUrl: bundledExample('calendar.json'),
      veloSourceUrl: bundledExample('velo.json'),
      dashSourceUrl: bundledExample('dash.json'),
    });
  }

  protected useBundledIcsExample(): void {
    void this.applyAndSave({
      calendarSource: 'ics',
      calendarSourceUrl: bundledExample('calendar.ics'),
    });
  }

  /** On the server, velo and dash run on the same host as mission control under /velo and /dash. */
  protected useServerApis(): void {
    void this.applyAndSave({
      veloApiUrl: `${location.origin}/velo`,
      dashApiUrl: `${location.origin}/dash`,
    });
  }

  protected launch(shortcut: AppShortcut): void {
    const didOpen = this.shortcutService.openExternal(shortcut.url);
    this.launchError.set(didOpen ? null : shortcut.label);
  }

  private async applyAndSave(settings: Partial<MissionControlSettings>): Promise<void> {
    if (!this.editable()) {
      return;
    }

    this.form.patchValue(settings);
    this.form.markAsDirty();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    await this.persist(() => this.settingsService.updateSettings(this.form.getRawValue()));
  }

  /** Saves through the backend with the form locked until the answer. */
  private async persist(action: () => Promise<SaveResult>): Promise<void> {
    this.saving.set(true);
    this.saveResult.set(null);
    const result = await action();
    this.saving.set(false);
    this.saveResult.set(result);
    await this.syncForm(result);
  }

  /** After a save the form shows the stored values; after a refused one it keeps the input for correction. */
  private async syncForm(result: SaveResult): Promise<void> {
    if (result.ok) {
      this.form.reset(this.savedSettings());
    } else if (result.reason === 'unavailable') {
      // The service reloads after an unconfirmed save; show what the backend really has
      await this.settingsService.whenLoaded();

      if (this.status() === 'ready') {
        this.form.reset(this.savedSettings());
      }
    }
  }
}
