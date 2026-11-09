import { DatePipe, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  LucideArrowDown,
  LucideArrowUp,
  LucideCalendarCheck,
  LucideInbox,
  LucideList,
  LucidePencil,
  LucidePlus,
  LucideRefreshCw,
  LucideSquareKanban,
  LucideTrash2,
} from '@lucide/angular';
import { I18nService } from '../../core/i18n/i18n.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { TranslationKey } from '../../core/i18n/translations';
import { CalendarEvent } from '../../core/models/calendar.model';
import { ESTIMATE_OPTIONS, TASK_STATUSES, Task, TaskStatus } from '../../core/models/task.model';
import { CalendarAdapterService } from '../../core/services/calendar-adapter.service';
import { ClockService } from '../../core/services/clock.service';
import { SettingsService } from '../../core/services/settings.service';
import { IntegrationNotice } from '../../shared/components/integration-notice/integration-notice';
import { SettingsStatusNotice } from '../../shared/components/settings-status-notice/settings-status-notice';
import { WidgetCard } from '../../shared/components/widget-card/widget-card';
import { localDateKey } from '../calendar/calendar-month';
import { busyMinutes, capacity, formatMinutes } from './capacity';
import { DailyPlanStore } from './daily-plan.store';

export const TODAY_VIEW_STORAGE_KEY = 'missioncontrol-today-view';
const TODAY_VIEWS = ['list', 'board'] as const;
type TodayView = (typeof TODAY_VIEWS)[number];

@Component({
  selector: 'app-today-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DailyPlanStore],
  imports: [
    DatePipe,
    NgTemplateOutlet,
    ReactiveFormsModule,
    IntegrationNotice,
    SettingsStatusNotice,
    WidgetCard,
    LucideArrowDown,
    LucideArrowUp,
    LucideCalendarCheck,
    LucideInbox,
    LucideList,
    LucidePencil,
    LucidePlus,
    LucideRefreshCw,
    LucideSquareKanban,
    LucideTrash2,
    TranslatePipe,
  ],
  templateUrl: './today-page.html',
  styleUrl: './today-page.scss',
})
export class TodayPage {
  protected readonly i18n = inject(I18nService);
  protected readonly plan = inject(DailyPlanStore);
  private readonly clock = inject(ClockService);
  private readonly settingsService = inject(SettingsService);
  private readonly calendarAdapter = inject(CalendarAdapterService);

  protected readonly statuses = TASK_STATUSES;
  protected readonly estimateOptions = ESTIMATE_OPTIONS;
  protected readonly formatMinutes = formatMinutes;
  protected readonly view = signal<TodayView>(readView());
  protected readonly events = signal<CalendarEvent[]>([]);
  protected readonly calendarStatus = this.calendarAdapter.status;
  /** Changes only with the calendar source, not with other settings such as the daily target. */
  private readonly calendarSourceKey = computed(() => {
    const { calendarSource, calendarSourceUrl } = this.settingsService.settings();
    return `${calendarSource}\n${calendarSourceUrl ?? ''}`;
  });
  /** Today as `YYYY-MM-DD`; changes at midnight, which loads the new day. */
  protected readonly todayKey = computed(() => localDateKey(this.clock.now()));
  protected readonly today = computed(() => this.clock.now());
  protected readonly capacity = computed(() =>
    capacity(
      this.plan.tasks(),
      this.settingsService.settings().dailyTargetHours,
      busyMinutes(this.events(), this.today()),
    ),
  );
  /** Share of the available time that is planned, for the bar (capped at 100 %). */
  protected readonly plannedShare = computed(() =>
    share(this.capacity().plannedMinutes, this.capacity().availableMinutes),
  );
  protected readonly doneShare = computed(() =>
    share(this.capacity().doneMinutes, this.capacity().availableMinutes),
  );
  protected readonly columns = computed(() =>
    TASK_STATUSES.map((status) => ({
      status,
      tasks: this.plan.tasks().filter((task) => task.status === status),
    })),
  );

  protected readonly addTitle = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(200)],
  });
  protected readonly addEstimate = new FormControl<number | null>(null);
  protected readonly dumpTitle = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(200)],
  });
  protected readonly editingId = signal<string | null>(null);
  /**
   * The task as it was when editing started: saving sends its version, so a change from another device
   * in the meantime ends in a conflict instead of being overwritten by the reloaded version.
   */
  private editingTask: Task | null = null;
  /** The picker values plus an estimate set elsewhere (e.g. 20 min through the API). */
  protected readonly editEstimateOptions = signal<number[]>([...ESTIMATE_OPTIONS]);
  protected readonly editTitle = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(200)],
  });
  protected readonly editEstimate = new FormControl<number | null>(null);
  // Forms need a FormGroup directive; a bare <form> would submit natively and reload the page
  protected readonly addForm = new FormGroup({ title: this.addTitle, estimate: this.addEstimate });
  protected readonly dumpForm = new FormGroup({ title: this.dumpTitle });
  protected readonly editForm = new FormGroup({
    title: this.editTitle,
    estimate: this.editEstimate,
  });
  private draggedId: string | null = null;
  /** Only the latest calendar load may set the appointments (a late, failed answer must not win). */
  private eventsGeneration = 0;

  constructor() {
    // Inputs are locked while a change is saved: a reset after the save must not drop newer typing
    effect(() => {
      const editable = this.plan.editable();
      for (const form of [this.addForm, this.dumpForm, this.editForm]) {
        if (editable) {
          form.enable({ emitEvent: false });
        } else {
          form.disable({ emitEvent: false });
        }
      }
    });
    effect(() => {
      const date = this.todayKey();
      untracked(() => void this.load(date));
    });
    // A changed calendar source changes the appointments and thus the capacity
    let firstSource = true;
    effect(() => {
      this.calendarSourceKey();
      if (firstSource) {
        firstSource = false;
        return;
      }
      untracked(() => void this.loadEvents());
    });
  }

  protected statusKey(status: TaskStatus): TranslationKey {
    return `today.status.${status}`;
  }

  protected refresh(): void {
    void this.load(this.todayKey());
  }

  protected setView(view: TodayView): void {
    this.view.set(view);
    try {
      globalThis.localStorage?.setItem(TODAY_VIEW_STORAGE_KEY, view);
    } catch {
      /* storage unavailable — keep the view for this session only */
    }
  }

  protected async add(): Promise<void> {
    if (this.addTitle.invalid || !this.addTitle.value.trim()) {
      this.addTitle.markAsTouched();
      return;
    }

    if (await this.plan.add(this.addTitle.value, this.addEstimate.value)) {
      this.addTitle.reset();
      this.addEstimate.reset();
    }
  }

  protected async addToDump(): Promise<void> {
    if (this.dumpTitle.invalid || !this.dumpTitle.value.trim()) {
      this.dumpTitle.markAsTouched();
      return;
    }

    if (await this.plan.add(this.dumpTitle.value, null, true)) {
      this.dumpTitle.reset();
    }
  }

  protected async setStatus(task: Task, event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;

    if (!(await this.plan.setStatus(task, select.value as TaskStatus))) {
      // The stored status did not change, so Angular would not rewrite the select
      select.value = task.status;
    }
  }

  protected startEdit(task: Task): void {
    this.editingId.set(task.id);
    this.editingTask = task;
    const estimate = task.estimateMinutes;
    this.editEstimateOptions.set(
      estimate === null || ESTIMATE_OPTIONS.some((minutes) => minutes === estimate)
        ? [...ESTIMATE_OPTIONS]
        : [...ESTIMATE_OPTIONS, estimate].sort((a, b) => a - b),
    );
    this.editTitle.reset(task.title);
    this.editEstimate.reset(task.estimateMinutes);
  }

  protected cancelEdit(): void {
    this.editingId.set(null);
    this.editingTask = null;
  }

  protected async saveEdit(): Promise<void> {
    const task = this.editingTask;

    if (!task) {
      return;
    }

    if (this.editTitle.invalid || !this.editTitle.value.trim()) {
      this.editTitle.markAsTouched();
      return;
    }

    const saved = await this.plan.edit(task, this.editTitle.value, this.editEstimate.value);

    // After a conflict the reloaded task is shown; saving the old snapshot again would conflict again
    if (saved || this.plan.error()?.key === 'today.error.conflict') {
      this.cancelEdit();
    }
  }

  protected onDragStart(task: Task, event: DragEvent): void {
    this.draggedId = task.id;
    event.dataTransfer?.setData('text/plain', task.id);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  protected onDragEnd(): void {
    this.draggedId = null;
  }

  protected onDragOver(event: DragEvent): void {
    if (this.draggedId && this.plan.editable()) {
      event.preventDefault();
    }
  }

  protected onDrop(status: TaskStatus, event: DragEvent): void {
    event.preventDefault();
    const id = event.dataTransfer?.getData('text/plain');
    // Only a task card dragged from this board, not text or files dropped onto the column
    const task = this.plan
      .tasks()
      .find((candidate) => candidate.id === this.draggedId && candidate.id === id);
    this.draggedId = null;

    if (task && task.status !== status) {
      void this.plan.setStatus(task, status);
    }
  }

  protected takeOverAll(): void {
    void this.plan.planToday(this.plan.carryOver().map((task) => task.id));
  }

  private async load(date: string): Promise<void> {
    // The calendar only reduces the capacity; the plan loads independently of it
    await Promise.all([this.plan.load(date), this.loadEvents()]);
  }

  private async loadEvents(): Promise<void> {
    const generation = ++this.eventsGeneration;
    const events = await this.calendarAdapter.getEvents();

    if (generation === this.eventsGeneration) {
      this.events.set(events);
    }
  }
}

function share(part: number, whole: number): number {
  if (whole <= 0) {
    return part > 0 ? 100 : 0;
  }

  return Math.min(100, Math.round((part / whole) * 100));
}

function readView(): TodayView {
  try {
    const stored = globalThis.localStorage?.getItem(TODAY_VIEW_STORAGE_KEY);
    return TODAY_VIEWS.find((view) => view === stored) ?? 'list';
  } catch {
    return 'list';
  }
}
