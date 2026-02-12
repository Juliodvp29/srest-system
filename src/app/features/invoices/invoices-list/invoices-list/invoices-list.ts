import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Invoice } from '@app/core/models/database.types';
import { Invoices } from '@app/core/services/invoices';
import { Supabase } from '@app/core/services/supabase';

@Component({
  selector: 'app-invoices-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, CurrencyPipe],
  templateUrl: './invoices-list.html',
  styleUrl: './invoices-list.css',
})
export class InvoicesList implements OnInit {
  private invoicesService = inject(Invoices);
  private supabase = inject(Supabase);
  private router = inject(Router);

  loading = signal<boolean>(true);
  invoices = signal<Invoice[]>([]);

  // Filters
  startDate = signal<string>(
    new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
  );
  endDate = signal<string>(new Date().toISOString().split('T')[0]);
  searchQuery = signal<string>('');
  statusFilter = signal<Invoice['status'] | ''>('');

  async ngOnInit() {
    await this.loadInvoices();
  }

  async loadInvoices() {
    this.loading.set(true);
    try {
      const user = await this.supabase.userProfile();
      if (!user?.branch_id) return;

      const end = new Date(this.endDate());
      end.setHours(23, 59, 59, 999);

      const data = await this.invoicesService.getInvoices(user.branch_id, {
        startDate: new Date(this.startDate()),
        endDate: end,
        search: this.searchQuery(),
        status: this.statusFilter() || undefined,
      });

      this.invoices.set(data);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      this.loading.set(false);
    }
  }

  onFilterChange() {
    this.loadInvoices();
  }

  viewDetail(invoiceId: string) {
    this.router.navigate(['/invoices/detail', invoiceId]);
  }

  printInvoice(invoiceId: string, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/invoices/print', invoiceId]);
  }

  printTicket(invoiceId: string, event: Event) {
    event.stopPropagation();
    window.open(`/invoices/ticket/${invoiceId}`, '_blank', 'width=400,height=600');
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
