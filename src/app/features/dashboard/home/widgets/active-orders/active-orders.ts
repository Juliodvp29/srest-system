import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, OnDestroy, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Order } from '@app/core/models/database.types';
import { AlertService } from '@app/core/services/alert';
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
export class ActiveOrders implements OnDestroy {
  private router = inject(Router);
  private ordersService = inject(Orders);
  private supabase = inject(Supabase);
  private alertService = inject(AlertService);

  private branchId = computed(() => this.supabase.userProfile()?.branch_id || '');
  private subscription?: any;

  refreshTrigger = signal(0);

  constructor() {
    // 1. Real-time Setup
    effect(() => {
      const bid = this.branchId();
      if (bid) {
        console.log('[ActiveOrders] Branch ID confirmed:', bid);
        this.setupRealtimeSync(bid);
      }
    });
  }

  orders = toSignal(
    toObservable(computed(() => ({ bid: this.branchId(), t: this.refreshTrigger() }))).pipe(
      switchMap(({ bid }) => {
        if (!bid) return from(Promise.resolve([] as DashboardOrder[]));
        console.log('[ActiveOrders] Fetching active orders for branch:', bid);
        return from(this.ordersService.getActiveOrders(bid, true) as Promise<DashboardOrder[]>);
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

  ngOnDestroy() {
    this.cleanupSubscription();
  }

  private cleanupSubscription() {
    if (this.subscription) {
      console.log('[ActiveOrders] Cleaning up existing subscription');
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  setupRealtimeSync(bid: string) {
    this.cleanupSubscription();

    const channelName = `dashboard-refresh-${bid}-${Math.random().toString(36).substring(7)}`;
    console.log('[ActiveOrders] Initializing Realtime fallback on channel:', channelName);

    this.subscription = this.supabase.client
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload: any) => {
          console.log('[ActiveOrders] EVENT DETECTED:', payload);
          // Only refresh if it belongs to our branch
          const eventBid = payload.new?.branch_id || payload.old?.branch_id;
          if (eventBid === bid) {
            console.log('[ActiveOrders] Match found! Refreshing...');
            this.refresh();

            if (payload.eventType === 'INSERT') {
              this.alertService.success(
                'Nuevo Pedido',
                'Se ha recibido un nuevo pedido en tiempo real.',
              );
            }
          }
        },
      )
      .subscribe((status) => {
        console.log('[ActiveOrders] Subscription status:', status);
      });
  }

  refresh() {
    this.refreshTrigger.update((v) => v + 1);
  }

  viewOrder(orderId: string) {
    this.router.navigate(['/pos/order-detail', orderId]);
  }
}
