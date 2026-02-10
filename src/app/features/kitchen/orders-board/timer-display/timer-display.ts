import { Component, computed, DestroyRef, inject, input, OnInit, signal } from '@angular/core';

@Component({
  selector: 'app-timer-display',
  imports: [],
  templateUrl: './timer-display.html',
  styleUrl: './timer-display.css',
})
export class TimerDisplay implements OnInit {
  createdAt = input.required<string>();

  private destroyRef = inject(DestroyRef);
  private intervalId: any;

  elapsedSeconds = signal(0);

  elapsedFormatted = computed(() => {
    const total = this.elapsedSeconds();
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  });

  /** normal < 10min, warning 10-20min, critical > 20min */
  urgencyLevel = computed<'normal' | 'warning' | 'critical'>(() => {
    const mins = this.elapsedSeconds() / 60;
    if (mins >= 20) return 'critical';
    if (mins >= 10) return 'warning';
    return 'normal';
  });

  urgencyColor = computed(() => {
    const level = this.urgencyLevel();
    if (level === 'critical') return 'text-red-500 dark:text-red-400';
    if (level === 'warning') return 'text-amber-500 dark:text-amber-400';
    return 'text-emerald-500 dark:text-emerald-400';
  });

  urgencyBg = computed(() => {
    const level = this.urgencyLevel();
    if (level === 'critical') return 'bg-red-50 dark:bg-red-500/10';
    if (level === 'warning') return 'bg-amber-50 dark:bg-amber-500/10';
    return 'bg-emerald-50 dark:bg-emerald-500/10';
  });

  ngOnInit() {
    this.updateElapsed();
    this.intervalId = setInterval(() => this.updateElapsed(), 1000);

    this.destroyRef.onDestroy(() => {
      if (this.intervalId) clearInterval(this.intervalId);
    });
  }

  private updateElapsed() {
    const created = new Date(this.createdAt()).getTime();
    const now = Date.now();
    this.elapsedSeconds.set(Math.max(0, Math.floor((now - created) / 1000)));
  }
}
