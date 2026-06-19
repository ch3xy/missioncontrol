import { Component, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MissionControlSettings } from '../../core/models/settings.model';
import { SettingsService } from '../../core/services/settings.service';
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

  protected readonly form = this.formBuilder.nonNullable.group({
    veloUrl: ['', [Validators.required]],
    dashUrl: ['', [Validators.required]],
    sevDeskUrl: ['', [Validators.required]],
    calendarSource: ['mock' as MissionControlSettings['calendarSource']],
    calendarSourceUrl: [''],
    veloSourceUrl: [''],
    dashSourceUrl: [''],
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
