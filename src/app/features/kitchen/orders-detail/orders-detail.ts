import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Order, OrderItem } from '@app/core/models/database.types';
import { AlertService } from '@app/core/services/alert';
import { Orders } from '@app/core/services/orders';
import { Supabase } from '@app/core/services/supabase';
import { KitchenOrder, KitchenOrderItem } from '../orders-board/order-card/order-card';
import { TimerDisplay } from '../orders-board/timer-display/timer-display';
import { ItemChecklist } from './item-checklist/item-checklist';

@Component({
  selector: 'app-orders-detail',
  imports: [CommonModule, ItemChecklist, TimerDisplay],
  templateUrl: './orders-detail.html',
  styleUrl: './orders-detail.css',
})
export class OrdersDetail implements OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ordersService = inject(Orders);
  private supabase = inject(Supabase);
  private alertService = inject(AlertService);

  private orderSubscription?: any;
  private itemsSubscription?: any;

  order = signal<KitchenOrder | null>(null);
  loading = signal(true);

  items = computed<KitchenOrderItem[]>(() => this.order()?.order_items || []);

  badgeColors: Record<string, string> = {
    pending: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
    preparing: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    ready: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
    delivered: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-sage',
  };

  statusLabels: Record<string, string> = {
    pending: 'Pendiente',
    preparing: 'En Preparación',
    ready: 'Listo',
    delivered: 'Entregado',
  };

  orderTypeLabels: Record<string, string> = {
    dine_in: 'Mesa',
    takeout: 'Para llevar',
    delivery: 'Domicilio',
    qr_order: 'QR',
  };

  orderTypeIcons: Record<string, string> = {
    dine_in: 'restaurant',
    takeout: 'takeout_dining',
    delivery: 'delivery_dining',
    qr_order: 'qr_code_2',
  };

  /** Which action buttons to show based on current order status */
  actions = computed<Array<{ label: string; status: Order['status']; icon: string; color: string }>>(() => {
    const status = this.order()?.status;
    const result: Array<{ label: string; status: Order['status']; icon: string; color: string }> = [];
    if (status === 'pending') {
      result.push({
        label: 'Iniciar Preparación',
        status: 'preparing',
        icon: 'skillet',
        color: 'bg-blue-500 hover:bg-blue-600 text-white',
      });
    }
    if (status === 'preparing') {
      result.push({
        label: 'Marcar Todo Listo',
        status: 'ready',
        icon: 'check_circle',
        color: 'bg-green-500 hover:bg-green-600 text-white',
      });
    }
    if (status === 'ready') {
      result.push({
        label: 'Entregar',
        status: 'delivered',
        icon: 'delivery_dining',
        color: 'bg-primary hover:bg-primary/90 text-white',
      });
    }
    return result;
  });

  constructor() {
    const orderId = this.route.snapshot.paramMap.get('orderId');
    if (orderId) {
      this.loadOrder(orderId);
      this.setupRealtime(orderId);
    }
  }

  ngOnDestroy() {
    if (this.orderSubscription) {
      this.orderSubscription.unsubscribe();
      this.orderSubscription = null;
    }
    if (this.itemsSubscription) {
      this.itemsSubscription.unsubscribe();
      this.itemsSubscription = null;
    }
  }

  private async loadOrder(orderId: string) {
    this.loading.set(true);
    try {
      const data = await this.ordersService.getOrderWithItems(orderId);
      this.order.set(data as KitchenOrder);
    } catch (error) {
      this.alertService.error('Error', 'No se pudo cargar el pedido.');
    } finally {
      this.loading.set(false);
    }
  }

  private setupRealtime(orderId: string) {
    // Subscribe to order changes
    this.orderSubscription = this.ordersService.subscribeToOrder(orderId, () => {
      this.loadOrder(orderId);
    });

    // Subscribe to order items changes
    this.itemsSubscription = this.ordersService.subscribeToOrderItems(orderId, () => {
      this.loadOrder(orderId);
    });
  }

  async onItemStatusChange(event: { itemId: string; status: OrderItem['status'] }) {
    try {
      await this.ordersService.updateItemStatus(event.itemId, event.status);
      // Reload to reflect changes
      const orderId = this.order()?.id;
      if (orderId) await this.loadOrder(orderId);
    } catch (error) {
      this.alertService.error('Error', 'No se pudo actualizar el estado del item.');
    }
  }

  async updateOrderStatus(newStatus: Order['status']) {
    const orderId = this.order()?.id;
    if (!orderId) return;

    try {
      // If marking as ready, also mark all items as ready
      if (newStatus === 'ready') {
        const items = this.items();
        for (const item of items) {
          if (item.status !== 'ready' && item.status !== 'delivered' && item.status !== 'cancelled') {
            await this.ordersService.updateItemStatus(item.id, 'ready');
          }
        }
      }

      await this.ordersService.updateOrderStatus(orderId, newStatus);
      this.alertService.success('Estado Actualizado', `Pedido movido a "${this.statusLabels[newStatus]}"`);
      await this.loadOrder(orderId);
    } catch (error) {
      this.alertService.error('Error', 'No se pudo actualizar el estado del pedido.');
    }
  }

  goBack() {
    this.router.navigate(['/kitchen/orders']);
  }
}
