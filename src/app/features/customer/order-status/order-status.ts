import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Orders } from '@app/core/services/orders';

@Component({
  selector: 'app-order-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './order-status.html',
  styleUrl: './order-status.css',
})
export class OrderStatus implements OnInit {
  private route = inject(ActivatedRoute);
  private ordersService = inject(Orders);
  private router = inject(Router);

  orderId = signal<string | null>(null);
  order = signal<any>(null);
  isLoading = signal<boolean>(true);
  private subscriptions: any[] = [];

  async ngOnInit() {
    this.route.paramMap.subscribe(async (params) => {
      const id = params.get('orderId');
      if (id) {
        this.orderId.set(id);
        await this.loadOrderStatus(id);
        this.setupRealtimeStatus(id);
      }
    });
  }

  ngOnDestroy() {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  setupRealtimeStatus(id: string) {
    // 1. Watch Items
    const itemsSub = this.ordersService.subscribeToOrderItems(id, (payload) => {
      this.loadOrderStatus(id);
    });

    // 2. Watch Order (Status)
    const orderSub = this.ordersService.subscribeToOrder(id, (payload) => {
      this.loadOrderStatus(id);
    });

    this.subscriptions.push(itemsSub, orderSub);
  }

  async loadOrderStatus(id: string) {
    this.isLoading.set(true);
    try {
      const data = await this.ordersService.getOrderWithItems(id);
      this.order.set(data);
    } catch (error) {
      console.error('Error loading order status', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  getStatusProgress(): number {
    const status = this.order()?.status;
    switch (status) {
      case 'pending':
        return 25;
      case 'preparing':
        return 50;
      case 'ready':
        return 75;
      case 'delivered':
        return 100;
      default:
        return 0;
    }
  }

  getStatusLabel(): string {
    const status = this.order()?.status;
    switch (status) {
      case 'pending':
        return 'En espera';
      case 'preparing':
        return 'Preparando';
      case 'ready':
        return '¡Listo para servir!';
      case 'delivered':
        return 'Entregado';
      default:
        return 'Desconocido';
    }
  }

  goBack() {
    this.router.navigate(['/customer/menu', this.order()?.table_id || 'unknown']);
  }
}
