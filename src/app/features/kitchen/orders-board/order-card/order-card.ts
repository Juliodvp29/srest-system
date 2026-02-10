import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { Order, OrderItem } from '@app/core/models/database.types';
import { TimerDisplay } from '../timer-display/timer-display';

export interface KitchenOrder extends Order {
  table?: { table_number: string };
  waiter?: { full_name: string };
  order_items?: KitchenOrderItem[];
}

export interface KitchenOrderItem extends OrderItem {
  product?: { name: string; price: number };
  order_item_modifiers?: Array<{
    modifier_name: string;
    price_adjustment: number;
  }>;
}

@Component({
  selector: 'app-order-card',
  imports: [CommonModule, TimerDisplay],
  templateUrl: './order-card.html',
  styleUrl: './order-card.css',
})
export class OrderCard {
  order = input.required<KitchenOrder>();

  statusChange = output<{ orderId: string; newStatus: Order['status'] }>();
  viewDetail = output<string>();

  itemsCount = computed(() => this.order().order_items?.length || 0);

  pendingItemsCount = computed(
    () => this.order().order_items?.filter((i) => i.status !== 'ready' && i.status !== 'delivered').length || 0,
  );

  badgeColors: Record<string, string> = {
    pending: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
    preparing: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    ready: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
  };

  statusLabels: Record<string, string> = {
    pending: 'Pendiente',
    preparing: 'En Preparación',
    ready: 'Listo',
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

  nextAction = computed<{ label: string; status: Order['status']; icon: string } | null>(() => {
    const status = this.order().status;
    if (status === 'pending') return { label: 'Preparar', status: 'preparing', icon: 'skillet' };
    if (status === 'preparing') return { label: 'Listo', status: 'ready', icon: 'check_circle' };
    return null;
  });

  onStatusChange(event: Event) {
    event.stopPropagation();
    const action = this.nextAction();
    if (action) {
      this.statusChange.emit({ orderId: this.order().id, newStatus: action.status });
    }
  }

  onViewDetail() {
    this.viewDetail.emit(this.order().id);
  }
}
