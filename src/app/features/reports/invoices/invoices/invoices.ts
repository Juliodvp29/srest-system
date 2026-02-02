import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Reports } from '@app/core/services/reports';
import { Supabase } from '@app/core/services/supabase';

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [CurrencyPipe, DatePipe],
  templateUrl: './invoices.html',
  styleUrl: './invoices.css',
})
export class InvoicesReport implements OnInit {
  private reportsService = inject(Reports);
  private supabase = inject(Supabase);

  loading = signal<boolean>(true);

  // Filters
  startDate = signal<string>(
    new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
  );
  endDate = signal<string>(new Date().toISOString().split('T')[0]);
  searchQuery = signal<string>('');

  invoices = signal<any[]>([]);
  filteredInvoices = signal<any[]>([]);

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    try {
      const user = await this.supabase.userProfile();
      if (!user?.branch_id) return;

      const data = await this.reportsService.getInvoices(
        user.branch_id,
        new Date(this.startDate()),
        new Date(this.endDate()),
      );

      this.invoices.set(data);
      this.applyFilter();
    } catch (err) {
      console.error('Error loading invoices:', err);
    } finally {
      this.loading.set(false);
    }
  }

  applyFilter() {
    const query = this.searchQuery().toLowerCase();
    if (!query) {
      this.filteredInvoices.set(this.invoices());
      return;
    }

    this.filteredInvoices.set(
      this.invoices().filter(
        (inv) =>
          inv.order_number?.toString().includes(query) ||
          inv.customer_name?.toLowerCase().includes(query) ||
          inv.waiter?.full_name?.toLowerCase().includes(query),
      ),
    );
  }

  onFilterChange() {
    this.loadData();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'delivered':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400';
      case 'cancelled':
        return 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400';
      case 'preparing':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-400';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'delivered':
        return 'Pagado';
      case 'cancelled':
        return 'Cancelado';
      case 'preparing':
        return 'Pendiente';
      default:
        return status;
    }
  }
}
