import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Order } from '@app/core/models/database.types';
import { Orders } from '@app/core/services/orders';
import { Supabase } from '@app/core/services/supabase';
import { from, switchMap } from 'rxjs';

interface DashboardOrder extends Order {
  table?: { table_number: string };
  waiter?: { full_name: string };
}

@Component({
  selector: 'app-active-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './active-orders.html',
  styleUrl: './active-orders.css',
})
export class ActiveOrders {
  private ordersService = inject(Orders);
  private supabase = inject(Supabase);

  private branchId = computed(() => this.supabase.userProfile()?.branch_id || '');

  refreshTrigger = signal(0);

  orders = toSignal(
    toObservable(computed(() => ({ bid: this.branchId(), t: this.refreshTrigger() }))).pipe(
      switchMap(({ bid }) => {
        if (!bid) return from(Promise.resolve([] as DashboardOrder[]));
        return from(this.ordersService.getActiveOrders(bid) as Promise<DashboardOrder[]>);
      }),
    ),
    { initialValue: [] as DashboardOrder[] },
  );

  badgeColors: Record<string, string> = {
    pending: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
    preparing: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    ready: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
  };

  statusLabels: Record<string, string> = {
    pending: 'Pendiente',
    preparing: 'En Cocina',
    ready: 'Listo',
  };

  refresh() {
    this.refreshTrigger.update((v) => v + 1);
  }
}
