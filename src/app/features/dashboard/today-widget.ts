import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  LucideCircle,
  LucideCircleCheck,
  LucideInbox,
  LucidePlay,
  LucidePlus,
} from '@lucide/angular';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { CalendarEvent } from '../../core/models/calendar.model';
import { Task } from '../../core/models/task.model';
import { ClockService } from '../../core/services/clock.service';
import { SettingsService } from '../../core/services/settings.service';
import { WidgetCard } from '../../shared/components/widget-card/widget-card';
import { localDateKey } from '../calendar/calendar-month';
import { busyMinutes, capacity, formatMinutes, share } from '../today/capacity';
import { DailyPlanStore } from '../today/daily-plan.store';

/** Tasks shown in the widget; the rest is one click away on the daily plan page. */
const VISIBLE_TASKS = 6;

/**
 * Mini version of the daily plan for the overview: today's tasks with quick actions
 * (done, start), quick capture into today or the brain dump, and the carry-over hint.
 * Everything else (estimates, editing, board, ordering) stays on the daily plan page.
 */
@Component({
  selector: 'app-today-widget',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DailyPlanStore],
  imports: [
    ReactiveFormsModule,
    RouterLink,
    WidgetCard,
    LucideCircle,
    LucideCircleCheck,
    LucideInbox,
    LucidePlay,
    LucidePlus,
    TranslatePipe,
  ],
  templateUrl: './today-widget.html',
  styleUrl: './today-widget.scss',
})
export class TodayWidget {
  protected readonly plan = inject(DailyPlanStore);
  private readonly clock = inject(ClockService);
  private readonly settingsService = inject(SettingsService);

  /** Today's appointments of the overview; they reduce the available time. */
  readonly events = input<CalendarEvent[]>([]);

  protected readonly formatMinutes = formatMinutes;
  protected readonly todayKey = computed(() => localDateKey(this.clock.now()));
  protected readonly capacity = computed(() =>
    capacity(
      this.plan.tasks(),
      this.settingsService.settings().dailyTargetHours,
      busyMinutes(this.events(), this.clock.now()),
    ),
  );
  protected readonly plannedShare = computed(() =>
    share(this.capacity().plannedMinutes, this.capacity().availableMinutes),
  );
  protected readonly doneCount = computed(
    () => this.plan.tasks().filter((task) => task.status === 'DONE').length,
  );
  /** Tasks in progress first, then open ones, then done ones (so a mistaken tick can be undone). */
  protected readonly visibleTasks = computed(() => {
    const rank = { IN_PROGRESS: 0, OPEN: 1, DONE: 2 } as const;
    const sorted = [...this.plan.tasks()].sort(
      (a, b) => rank[a.status] - rank[b.status] || a.position - b.position,
    );
    return sorted.slice(0, VISIBLE_TASKS);
  });
  protected readonly hiddenCount = computed(
    () => this.plan.tasks().length - this.visibleTasks().length,
  );
  protected readonly allDone = computed(
    () => this.plan.tasks().length > 0 && this.doneCount() === this.plan.tasks().length,
  );

  protected readonly title = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(200)],
  });
  // A bare <form> would submit natively and reload the page
  protected readonly form = new FormGroup({ title: this.title });

  constructor() {
    // Locked while a change is saved, like on the daily plan page
    effect(() => {
      if (this.plan.editable()) {
        this.form.enable({ emitEvent: false });
      } else {
        this.form.disable({ emitEvent: false });
      }
    });
    effect(() => {
      const date = this.todayKey();
      untracked(() => void this.plan.load(date));
    });
  }

  /** Reloads the plan, e.g. with the refresh button of the overview. */
  reload(): Promise<void> {
    return this.plan.reload();
  }

  protected async add(toBacklog: boolean): Promise<void> {
    if (this.title.invalid || !this.title.value.trim()) {
      this.title.markAsTouched();
      return;
    }

    if (await this.plan.add(this.title.value, null, toBacklog)) {
      this.title.reset();
    }
  }

  protected toggleDone(task: Task): void {
    void this.plan.setStatus(task, task.status === 'DONE' ? 'OPEN' : 'DONE');
  }

  protected start(task: Task): void {
    void this.plan.setStatus(task, 'IN_PROGRESS');
  }

  protected takeOverAll(): void {
    void this.plan.planToday(this.plan.carryOver().map((task) => task.id));
  }
}
