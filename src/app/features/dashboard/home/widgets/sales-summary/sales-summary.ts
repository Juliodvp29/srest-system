import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Orders } from '@app/core/services/orders';
import { Supabase } from '@app/core/services/supabase';
import { from, switchMap } from 'rxjs';

@Component({
  selector: 'app-sales-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sales-summary.html',
  styleUrl: './sales-summary.css',
})
export class SalesSummary {
  private ordersService = inject(Orders);
  private supabase = inject(Supabase);

  private branchId = computed(() => this.supabase.userProfile()?.branch_id || '');

  refreshTrigger = signal(0);

  stats = toSignal(
    toObservable(computed(() => ({ bid: this.branchId(), t: this.refreshTrigger() }))).pipe(
      switchMap(({ bid }) => {
        if (!bid) return from(Promise.resolve({ totalSales: 0, orderCount: 0 }));
        return from(this.ordersService.getDailyStats(bid));
      }),
    ),
    { initialValue: { totalSales: 0, orderCount: 0 } },
  );

  refresh() {
    this.refreshTrigger.update((v) => v + 1);
  }
}
