import { CommonModule, CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Order } from '@app/core/models/database.types';
import { Invoices } from '@app/core/services/invoices';
import { Orders } from '@app/core/services/orders';

import { AlertService } from '@app/core/services/alert';

@Component({
  selector: 'app-create-invoice',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  templateUrl: './create-invoice.html',
  styleUrl: './create-invoice.css',
})
export class CreateInvoice implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ordersService = inject(Orders);
  private invoicesService = inject(Invoices);
  private alertService = inject(AlertService);

  loading = signal<boolean>(true);
  creating = signal<boolean>(false);
  order = signal<Order | null>(null);

  // Form Data
  customerName = signal<string>('');
  customerNit = signal<string>('');
  customerEmail = signal<string>('');
  customerAddress = signal<string>('');

  // Computed
  subtotal = signal<number>(0);
  tax = signal<number>(0);
  total = signal<number>(0);

  async ngOnInit() {
    const orderId = this.route.snapshot.paramMap.get('orderId');
    if (!orderId) {
      this.router.navigate(['/invoices/list']);
      return;
    }

    try {
      // Check if invoice already exists
      const existingInvoice = await this.invoicesService.getInvoiceByOrderId(orderId);
      if (existingInvoice) {
        // Redirect to detail if already exists
        this.router.navigate(['/invoices/detail', existingInvoice.id]);
        return;
      }

      await this.loadOrder(orderId);
    } catch (error) {
      console.error('Error loading order:', error);
      this.router.navigate(['/invoices/list']);
    } finally {
      this.loading.set(false);
    }
  }

  async loadOrder(orderId: string) {
    const orderData = await this.ordersService.getOrderWithItems(orderId);
    this.order.set(orderData);

    // Pre-fill customer data if available
    if (orderData.customer_name) this.customerName.set(orderData.customer_name);

    // Calculate totals (logic from order)
    // Assuming order.total includes tax
    const orderTotal = orderData.total || 0;
    const orderTax = orderTotal * 0.19; // 19% tax (approximation if not stored)
    const orderSubtotal = orderTotal - orderTax;

    this.total.set(orderTotal);
    this.tax.set(orderTax);
    this.subtotal.set(orderSubtotal);
  }

  async createInvoice() {
    if (!this.customerName() || !this.customerNit()) {
      this.alertService.error('Error', 'Por favor complete el nombre y NIT del cliente');
      return;
    }

    this.creating.set(true);
    try {
      const order = this.order();
      if (!order) return;

      const invoiceData = {
        order_id: order.id,
        invoice_number: `FAC-${Date.now().toString().slice(-6)}`, // Temporary generation
        customer_name: this.customerName(),
        customer_nit: this.customerNit(),
        customer_email: this.customerEmail(),
        customer_address: this.customerAddress(),
        subtotal: this.subtotal(),
        tax: this.tax(),
        total: this.total(),
        status: 'sent', // Assume sent for now
        created_at: new Date().toISOString(),
      };

      const newInvoice = await this.invoicesService.createInvoice(invoiceData as any);
      this.router.navigate(['/invoices/detail', newInvoice.id]);
    } catch (error) {
      console.error('Error creating invoice:', error);
      this.alertService.error('Error', 'Error al crear la factura. Por favor intente nuevamente.');
    } finally {
      this.creating.set(false);
    }
  }

  cancel() {
    this.router.navigate(['/invoices/list']);
  }
}
