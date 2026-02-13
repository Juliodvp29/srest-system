import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Orders } from '@app/core/services/orders';
import { Supabase } from '@app/core/services/supabase';
import { Tables } from '@app/core/services/tables';
import { from, map, switchMap, zip } from 'rxjs';

@Component({
  selector: 'app-daily-stats',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './daily-stats.html',
  styleUrl: './daily-stats.css',
})
export class DailyStats {
  private ordersService = inject(Orders);
  private tablesService = inject(Tables);
  private supabase = inject(Supabase);

  private branchId = computed(() => this.supabase.userProfile()?.branch_id || '');

  refreshTrigger = signal(0);

  stats = toSignal(
    toObservable(computed(() => ({ bid: this.branchId(), t: this.refreshTrigger() }))).pipe(
      switchMap(({ bid }) => {
        if (!bid)
          return from(
            Promise.resolve({
              avgTicket: 0,
              occupancyRate: 0,
              totalTables: 0,
              occupiedTables: 0,
            }),
          );

        return zip([
          from(this.ordersService.getDailyStats(bid)),
          from(this.tablesService.getTablesByBranch(bid)),
        ]).pipe(
          map(([orderStats, tables]) => {
            const avgTicket =
              orderStats.orderCount > 0 ? orderStats.totalSales / orderStats.orderCount : 0;

            const totalTables = tables.length;
            const occupiedTables = tables.filter((t) => t.status === 'occupied').length;
            const occupancyRate = totalTables > 0 ? occupiedTables / totalTables : 0;

            return {
              avgTicket,
              occupancyRate,
              totalTables,
              occupiedTables,
            };
          }),
        );
      }),
    ),
    {
      initialValue: {
        avgTicket: 0,
        occupancyRate: 0,
        totalTables: 0,
        occupiedTables: 0,
      },
    },
  );

  refresh() {
    this.refreshTrigger.update((v) => v + 1);
  }
}
