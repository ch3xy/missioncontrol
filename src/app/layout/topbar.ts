import { DatePipe } from '@angular/common';
import { Component, computed, signal } from '@angular/core';

@Component({
  selector: 'app-topbar',
  imports: [DatePipe],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar {
  private readonly now = signal(new Date());

  protected readonly today = computed(() => this.now());
}
