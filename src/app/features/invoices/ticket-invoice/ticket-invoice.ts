import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Invoice, Branch } from '@app/core/models/database.types';
import { Invoices } from '@app/core/services/invoices';
import { Branches } from '@app/core/services/branches';

@Component({
  selector: 'app-ticket-invoice',
 changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DatePipe, CurrencyPipe],
  templateUrl: './ticket-invoice.html',
  styleUrl: './ticket-invoice.css',
})
export class TicketInvoice implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private invoicesService = inject(Invoices);
  private branchesService = inject(Branches);

  branch = signal<Branch | null>(null);
  invoice = signal<any | null>(null);
  loading = signal<boolean>(true);

  async ngOnInit() {
    const invoiceId = this.route.snapshot.paramMap.get('id');
    if (invoiceId) {
      await this.loadInvoice(invoiceId);
    }
  }

  async loadInvoice(id: string) {
    try {
      // Load branch info first
      const branchData = await this.branchesService.getBranch();
      this.branch.set(branchData);

      const data = await this.invoicesService.getInvoice(id);
      this.invoice.set(data);

      // Auto-print after a short delay to ensure rendering
      setTimeout(() => {
        window.print();
      }, 500);
    } catch (error) {
      console.error('Error loading invoice:', error);
    } finally {
      this.loading.set(false);
    }
  }

  close() {
    window.close();
  }
}
