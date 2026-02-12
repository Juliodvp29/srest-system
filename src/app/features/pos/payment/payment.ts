import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Invoices } from '@app/core/services/invoices';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertService } from '@app/core/services/alert';
import { Orders } from '@app/core/services/orders';
import { Payments } from '@app/core/services/payments';
import { Tables } from '@app/core/services/tables';

@Component({
  selector: 'app-payment',
  imports: [CommonModule, FormsModule],
  templateUrl: './payment.html',
  styleUrl: './payment.css',
  standalone: true,
  providers: [CurrencyPipe],
})
export class Payment implements OnInit {
  private route = inject(ActivatedRoute);
  public router = inject(Router);
  private ordersService = inject(Orders);
  private paymentsService = inject(Payments);
  private tablesService = inject(Tables);
  private invoicesService = inject(Invoices);
  private alertService = inject(AlertService);

  orderId = signal<string>('');
  order = signal<any>(null);
  loading = signal<boolean>(true);
  processing = signal<boolean>(false);
  paymentSuccess = signal<boolean>(false);

  // Payment State
  paymentMethod = signal<'cash' | 'card' | 'transfer'>('cash');
  amountTendered = signal<number>(0);

  // Computed
  total = computed(() => this.order()?.total || 0);
  change = computed(() => {
    if (this.paymentMethod() !== 'cash') return 0;
    return Math.max(0, this.amountTendered() - this.total());
  });

  isValid = computed(() => {
    if (this.paymentMethod() === 'cash') {
      return this.amountTendered() >= this.total();
    }
    return true; // For card/transfer assume external terminal success
  });

  async ngOnInit() {
    this.route.paramMap.subscribe(async (params) => {
      const id = params.get('orderId');
      if (id) {
        this.orderId.set(id);
        await this.loadOrder(id);
      }
    });
  }

  async loadOrder(id: string) {
    this.loading.set(true);
    try {
      const data = await this.ordersService.getOrderWithItems(id);
      this.order.set(data);
      // Auto-set tendered to total for convenience
      this.amountTendered.set(data.total);
    } catch (err) {
      console.error('Error loading order:', err);
    } finally {
      this.loading.set(false);
    }
  }

  setMethod(method: 'cash' | 'card' | 'transfer') {
    this.paymentMethod.set(method);
    if (method !== 'cash') {
      this.amountTendered.set(this.total());
    }
  }

  async processPayment() {
    if (!this.isValid() || this.processing()) return;

    this.processing.set(true);
    try {
      // 1. Process Payment via Service
      await this.paymentsService.processPayment({
        orderId: this.orderId(),
        paymentMethod: this.paymentMethod(),
        amount: this.total() // Assuming full payment for now
      });

      // 2. Refresh Table Status (In case there are multiple orders)
      if (this.order().table_id) {
        await this.tablesService.checkAndUpdateTableStatus(this.order().table_id);
      }

      // 3. Show Success & Allow Print
      this.alertService.success('Éxito', 'Pago procesado correctamente!');
      this.paymentSuccess.set(true);
      // this.router.navigate(['/pos/tables']);
    } catch (err) {
      console.error('Error processing payment:', err);
      this.alertService.error('Error', 'Error al procesar el pago.');
    } finally {
      this.processing.set(false);
    }
  }

  async printReceipt() {
    try {
      const invoice = await this.invoicesService.getInvoiceByOrderId(this.orderId());
      if (invoice) {
        window.open(`/invoices/ticket/${invoice.id}`, '_blank', 'width=400,height=600');
      } else {
        this.alertService.error('Error', 'No se encontró la factura para imprimir.');
      }
    } catch (err) {
      console.error('Error finding invoice:', err);
    }
  }
}
