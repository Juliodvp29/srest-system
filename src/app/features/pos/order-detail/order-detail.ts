import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from '@app/core/services/alert';
import { Employee, Employees } from '@app/core/services/employees';
import { Orders } from '@app/core/services/orders';
import { Supabase } from '@app/core/services/supabase';
import { Tables } from '@app/core/services/tables';

@Component({
  selector: 'app-order-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  private employeesService = inject(Employees);
  private supabase = inject(Supabase);
  private elRef = inject(ElementRef);

  orderId = signal<string>('');
  order = signal<any>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Waiter selector
  waiters = signal<Employee[]>([]);
  showWaiterSelector = signal(false);
  assigningWaiter = signal(false);

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

  async loadWaiters() {
    try {
      const branchId = this.supabase.userProfile()?.branch_id || '';
      if (branchId) {
        const waiters = await this.employeesService.getEmployeesByRole(branchId, 'waiter');
        this.waiters.set(waiters);
      }
    } catch (err) {
      console.error('Error loading waiters:', err);
    }
  }

  async toggleWaiterSelector() {
    if (!this.showWaiterSelector()) {
      await this.loadWaiters();
    }
    this.showWaiterSelector.update((v) => !v);
  }

  async assignWaiter(waiterId: string | null) {
    const orderId = this.orderId();
    if (!orderId) return;

    this.assigningWaiter.set(true);
    try {
      await this.ordersService.assignWaiter(orderId, waiterId);
      await this.loadOrder(orderId);
      this.showWaiterSelector.set(false);
      this.alertService.success(
        'Mesero Asignado',
        waiterId ? 'El mesero fue asignado correctamente.' : 'Se quitó el mesero de la orden.',
      );
    } catch (err) {
      console.error('Error assigning waiter:', err);
      this.alertService.error('Error', 'No se pudo asignar el mesero.');
    } finally {
      this.assigningWaiter.set(false);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.waiter-selector-container')) {
      this.showWaiterSelector.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/pos/tables']);
  }
}
