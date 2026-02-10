import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, OnDestroy, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Order } from '@app/core/models/database.types';
import { AlertService } from '@app/core/services/alert';
import { Orders } from '@app/core/services/orders';
import { Supabase } from '@app/core/services/supabase';
import { from, switchMap } from 'rxjs';
import { KitchenOrder, OrderCard } from './order-card/order-card';

@Component({
  selector: 'app-orders-board',
  imports: [CommonModule, OrderCard],
  templateUrl: './orders-board.html',
  styleUrl: './orders-board.css',
})
export class OrdersBoard implements OnDestroy {
  private router = inject(Router);
  private ordersService = inject(Orders);
  private supabase = inject(Supabase);
  private alertService = inject(AlertService);

  private branchId = computed(() => this.supabase.userProfile()?.branch_id || '');
  private subscription?: any;
  private pollingInterval?: any;

  refreshTrigger = signal(0);

  constructor() {
    // Realtime setup
    effect(() => {
      const bid = this.branchId();
      if (bid) {
        this.setupRealtimeSync(bid);
      }
    });

    // Polling fallback every 15 seconds
    this.pollingInterval = setInterval(() => this.refresh(), 15000);
  }

  // Load active orders via signal
  orders = toSignal(
    toObservable(computed(() => ({ bid: this.branchId(), t: this.refreshTrigger() }))).pipe(
      switchMap(({ bid }) => {
        if (!bid) return from(Promise.resolve([] as KitchenOrder[]));
        return from(this.ordersService.getActiveOrders(bid) as Promise<KitchenOrder[]>);
      }),
    ),
    { initialValue: [] as KitchenOrder[] },
  );

  // Kanban columns
  pendingOrders = computed(() => this.orders().filter((o) => o.status === 'pending'));
  preparingOrders = computed(() => this.orders().filter((o) => o.status === 'preparing'));
  readyOrders = computed(() => this.orders().filter((o) => o.status === 'ready'));

  ngOnDestroy() {
    this.cleanupSubscription();
    if (this.pollingInterval) clearInterval(this.pollingInterval);
  }

  private cleanupSubscription() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  private setupRealtimeSync(bid: string) {
    this.cleanupSubscription();

    const channelName = `kitchen-board-${bid}-${Math.random().toString(36).substring(7)}`;

    this.subscription = this.supabase.client
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload: any) => {
          const eventBid = payload.new?.branch_id || payload.old?.branch_id;
          if (eventBid === bid) {
            this.refresh();

            if (payload.eventType === 'INSERT') {
              this.alertService.info('Nuevo Pedido', 'Se ha recibido un nuevo pedido.');
            }
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'order_items' },
        () => this.refresh(),
      )
      .subscribe();
  }

  refresh() {
    this.refreshTrigger.update((v) => v + 1);
  }

  async onStatusChange(event: { orderId: string; newStatus: Order['status'] }) {
    try {
      await this.ordersService.updateOrderStatus(event.orderId, event.newStatus);
      this.alertService.success(
        'Estado Actualizado',
        `Pedido movido a "${event.newStatus === 'preparing' ? 'En Preparación' : 'Listo'}"`,
      );
      this.refresh();
    } catch (error) {
      this.alertService.error('Error', 'No se pudo actualizar el estado del pedido.');
    }
  }

  viewOrderDetail(orderId: string) {
    this.router.navigate(['/kitchen/order-detail', orderId]);
  }
}
