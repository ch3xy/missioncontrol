import { DestroyRef, Injectable, inject, signal } from '@angular/core';

const TICK_MS = 60_000;

/** The current time, updated every minute, so views that depend on "today" roll over at midnight. */
@Injectable({ providedIn: 'root' })
export class ClockService {
  private readonly nowState = signal(new Date());

  readonly now = this.nowState.asReadonly();

  constructor() {
    const timer = setInterval(() => this.nowState.set(new Date()), TICK_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }
}
