import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideDownload, LucideRotateCcw, LucideSave, LucideUpload } from '@lucide/angular';
import { I18nService, LANGUAGE_LABELS, LANGUAGES } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { TranslationKey } from '../../core/i18n/translations';
import { AppShortcut } from '../../core/models/shortcut.model';
import { MissionControlSettings } from '../../core/models/settings.model';
import { ShortcutService } from '../../core/services/shortcut.service';
import { SettingsService } from '../../core/services/settings.service';
import { THEME_MODE_LABELS, ThemeMode, ThemeService } from '../../core/services/theme.service';
import { httpUrlValidator } from '../../core/validators/http-url.validator';
import { sourceUrlsValidator } from '../../core/validators/source-urls.validator';
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

  protected readonly savedSettings = this.settingsService.settings;
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
    dailyTargetHours: [8, [Validators.required, Validators.min(0.5), Validators.max(24)]],
    localTool1Label: ['Local Tool 1', [Validators.required]],
    localTool1Url: ['', [httpUrlValidator({ optional: true })]],
    localTool2Label: ['Local Tool 2', [Validators.required]],
    localTool2Url: ['', [httpUrlValidator({ optional: true })]],
  });

  constructor() {
    this.form.patchValue(this.savedSettings());
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.settingsService.updateSettings(this.form.getRawValue());
  }

  protected reset(): void {
    this.settingsService.resetSettings();
    this.form.reset(this.savedSettings());
  }

  protected exportSettings(): void {
    const blob = new Blob([this.settingsService.exportSettings()], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mission-control-settings.json';
    link.click();
    URL.revokeObjectURL(url);
    this.backupMessage.set('settings.exported');
  }

  protected importSettings(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const didImport = this.settingsService.importSettings(String(reader.result ?? ''));
      this.form.reset(this.savedSettings());
      this.backupMessage.set(didImport ? 'settings.imported' : 'settings.importFailed');
      input.value = '';
    };
    reader.onerror = () => {
      this.backupMessage.set('settings.importFailed');
      input.value = '';
    };
    reader.readAsText(file);
  }

  protected useBundledJsonExamples(): void {
    this.applyAndSave({
      calendarSource: 'local-json',
      calendarSourceUrl: bundledExample('calendar.json'),
      veloSourceUrl: bundledExample('velo.json'),
      dashSourceUrl: bundledExample('dash.json'),
    });
  }

  protected useBundledIcsExample(): void {
    this.applyAndSave({
      calendarSource: 'ics',
      calendarSourceUrl: bundledExample('calendar.ics'),
    });
  }

  /** On the server, velo and dash run on the same host as mission control under /velo and /dash. */
  protected useServerApis(): void {
    this.applyAndSave({
      veloApiUrl: `${location.origin}/velo`,
      dashApiUrl: `${location.origin}/dash`,
    });
  }

  protected launch(shortcut: AppShortcut): void {
    const didOpen = this.shortcutService.openExternal(shortcut.url);
    this.launchError.set(didOpen ? null : shortcut.label);
  }

  private applyAndSave(settings: Partial<MissionControlSettings>): void {
    this.form.patchValue(settings);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.settingsService.updateSettings(this.form.getRawValue());
    this.form.reset(this.savedSettings());
  }
}
