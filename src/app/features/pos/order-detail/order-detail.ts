import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from '@app/core/services/alert';
import { Orders } from '@app/core/services/orders';
import { Tables } from '@app/core/services/tables';

@Component({
  selector: 'app-order-detail',
  imports: [CommonModule],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.css',
  providers: [CurrencyPipe, DatePipe],
})
export class OrderDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ordersService = inject(Orders);
  private tablesService = inject(Tables);
  private alertService = inject(AlertService);

  orderId = signal<string>('');
  order = signal<any>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Subscriptions
  private orderSub: any;

  async ngOnInit() {
    this.route.paramMap.subscribe(async (params) => {
      const id = params.get('orderId');
      if (id) {
        this.orderId.set(id);
        await this.loadOrder(id);
        this.setupSubscription(id);
      }
    });
  }

  async loadOrder(id: string) {
    this.loading.set(true);
    try {
      const data = await this.ordersService.getOrderWithItems(id);
      this.order.set(data);
    } catch (err) {
      console.error('Error loading order:', err);
      this.error.set('Could not load order details');
    } finally {
      this.loading.set(false);
    }
  }

  setupSubscription(orderId: string) {
    // Subscribe to order items changes (e.g. if another waiter adds items)
    this.orderSub = this.ordersService.subscribeToOrderItems(orderId, () => {
      this.loadOrder(orderId);
    });
  }

  async addMoreItems() {
    const order = this.order();
    if (order && order.table_id) {
      // NOTE: In NewOrder we need logic to handle appending to existing order
      // For now we just navigate there.
      // ideally: /pos/new-order/tableId?existingOrderId=xyz
      this.router.navigate(['/pos/new-order', order.table_id], {
        queryParams: { orderId: this.orderId() },
      });
    }
  }

  goToPayment() {
    this.router.navigate(['/pos/payment', this.orderId()]);
  }

  goToSplitBill() {
    this.router.navigate(['/pos/split-bill', this.orderId()]);
  }

  printBill() {
    window.print(); // Simple placeholder for now
  }

  async cancelOrder() {
    const order = this.order();
    if (!order) return;

    const confirmed = await this.alertService.confirm(
      '¿Cancelar Pedido?',
      '¿Estás seguro de que deseas cancelar este pedido? Esta acción no se puede deshacer.',
      'Sí, Cancelar',
      'No, Mantener',
    );

    if (!confirmed) return;

    try {
      await this.ordersService.cancelOrder(this.orderId());

      if (order.table_id) {
        await this.tablesService.checkAndUpdateTableStatus(order.table_id);
      }

      this.alertService.success('Pedido Cancelado', 'El pedido ha sido cancelado correctamente.');
      this.router.navigate(['/pos/tables']);
    } catch (err) {
      console.error('Error cancelling order:', err);
      this.alertService.error('Error', 'No se pudo cancelar el pedido.');
    }
  }

  goBack() {
    this.router.navigate(['/pos/tables']);
  }
}
