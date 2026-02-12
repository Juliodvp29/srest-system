import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Invoices } from '@app/core/services/invoices';

import { AlertService } from '@app/core/services/alert';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  templateUrl: './invoice-detail.html',
  styleUrl: './invoice-detail.css',
})
export class InvoiceDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private invoicesService = inject(Invoices);
  private alertService = inject(AlertService);

  loading = signal<boolean>(true);
  invoice = signal<any | null>(null);

  async ngOnInit() {
    const invoiceId = this.route.snapshot.paramMap.get('invoiceId');
    if (!invoiceId) {
      this.router.navigate(['/invoices/list']);
      return;
    }

    try {
      const data = await this.invoicesService.getInvoice(invoiceId);
      this.invoice.set(data);
    } catch (error) {
      console.error('Error loading invoice:', error);
      this.router.navigate(['/invoices/list']);
    } finally {
      this.loading.set(false);
    }
  }

  printInvoice() {
    const id = this.invoice()?.id;
    if (id) {
      this.router.navigate(['/invoices/print', id]);
    }
  }

  async cancelInvoice() {
    const confirmed = await this.alertService.confirm(
      'Anular Factura',
      '¿Está seguro de anular esta factura? Esta acción no se puede deshacer.',
      'Anular',
      'Cancelar'
    );

    if (!confirmed) return;

    this.loading.set(true);
    try {
      await this.invoicesService.updateInvoice(this.invoice().id, { status: 'cancelled' });
      // Refresh
      const data = await this.invoicesService.getInvoice(this.invoice().id);
      this.invoice.set(data);
    } catch (error) {
      console.error('Error cancelling invoice:', error);
      this.alertService.error('Error', 'Error al anular la factura');
    } finally {
      this.loading.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/invoices/list']);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'sent':
      case 'accepted':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400';
      case 'cancelled':
      case 'rejected':
        return 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400';
      case 'draft':
        return 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-400';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-400';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'sent': return 'Enviada';
      case 'accepted': return 'Pagada';
      case 'rejected': return 'Rechazada';
      case 'cancelled': return 'Anulada';
      case 'draft': return 'Borrador';
      default: return status;
    }
  }
}
