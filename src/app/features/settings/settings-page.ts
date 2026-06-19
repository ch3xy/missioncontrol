import { Component, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MissionControlSettings } from '../../core/models/settings.model';
import { SettingsService } from '../../core/services/settings.service';
import { httpUrlValidator } from '../../core/validators/http-url.validator';
import { WidgetCard } from '../../shared/components/widget-card/widget-card';

@Component({
  selector: 'app-settings-page',
  imports: [ReactiveFormsModule, WidgetCard],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.css',
})
export class SettingsPage {
  private readonly formBuilder = inject(FormBuilder);
  private readonly settingsService = inject(SettingsService);

  protected readonly savedSettings = this.settingsService.settings;
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
      return 'ICS import is planned; the MVP keeps using mock data until an ICS adapter is added.';
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
}
