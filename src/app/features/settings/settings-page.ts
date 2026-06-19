import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AppShortcut } from '../../core/models/shortcut.model';
import { MissionControlSettings } from '../../core/models/settings.model';
import { ShortcutService } from '../../core/services/shortcut.service';
import { SettingsService } from '../../core/services/settings.service';
import { httpUrlValidator } from '../../core/validators/http-url.validator';
import { QuickAccessTile } from '../../shared/components/quick-access-tile/quick-access-tile';
import { WidgetCard } from '../../shared/components/widget-card/widget-card';

@Component({
  selector: 'app-settings-page',
  imports: [ReactiveFormsModule, QuickAccessTile, WidgetCard],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.css',
})
export class SettingsPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly settingsService = inject(SettingsService);
  private readonly shortcutService = inject(ShortcutService);

  protected readonly savedSettings = this.settingsService.settings;
  protected readonly shortcuts = this.shortcutService.shortcuts;
  protected readonly launchError = signal<string | null>(null);
  protected readonly backupMessage = signal<string | null>(null);
  protected readonly savedMessage = computed(
    () =>
      `Configured launch URLs: Velo ${this.savedSettings().veloUrl}, Dash ${
        this.savedSettings().dashUrl
      }, sevDesk ${this.savedSettings().sevDeskUrl}`,
  );
  protected readonly sourceHint = computed(() => {
    const settings = this.savedSettings();

    if (settings.calendarSource === 'mock') {
      return 'Calendar uses mock data. Local JSON fields are optional placeholders.';
    }

    if (settings.calendarSource === 'ics') {
      return 'Calendar attempts the configured ICS URL and falls back to mock data if it fails.';
    }

    return 'Calendar attempts the configured local JSON URL and falls back to mock data if it fails.';
  });

  protected readonly form = this.formBuilder.nonNullable.group({
    veloUrl: ['', [Validators.required, httpUrlValidator()]],
    dashUrl: ['', [Validators.required, httpUrlValidator()]],
    sevDeskUrl: ['', [Validators.required, httpUrlValidator()]],
    calendarSource: ['mock' as MissionControlSettings['calendarSource']],
    calendarSourceUrl: ['', [httpUrlValidator({ optional: true })]],
    veloSourceUrl: ['', [httpUrlValidator({ optional: true })]],
    dashSourceUrl: ['', [httpUrlValidator({ optional: true })]],
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
    this.backupMessage.set('Settings export created.');
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
      this.backupMessage.set(didImport ? 'Settings imported.' : 'Settings import failed.');
      input.value = '';
    };
    reader.onerror = () => {
      this.backupMessage.set('Settings import failed.');
      input.value = '';
    };
    reader.readAsText(file);
  }

  protected useBundledJsonExamples(): void {
    this.applyAndSave({
      calendarSource: 'local-json',
      calendarSourceUrl: `${location.origin}/examples/calendar.json`,
      veloSourceUrl: `${location.origin}/examples/velo.json`,
      dashSourceUrl: `${location.origin}/examples/dash.json`,
    });
  }

  protected useBundledIcsExample(): void {
    this.applyAndSave({
      calendarSource: 'ics',
      calendarSourceUrl: `${location.origin}/examples/calendar.ics`,
    });
  }

  protected launch(shortcut: AppShortcut): void {
    const didOpen = this.shortcutService.openExternal(shortcut.url);
    this.launchError.set(didOpen ? null : `${shortcut.label} has no valid http(s) URL configured.`);
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
