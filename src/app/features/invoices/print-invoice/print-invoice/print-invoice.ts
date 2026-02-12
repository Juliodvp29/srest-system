import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Invoices } from '@app/core/services/invoices';

@Component({
  selector: 'app-print-invoice',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  templateUrl: './print-invoice.html',
  styleUrl: './print-invoice.css',
})
export class PrintInvoice implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private invoicesService = inject(Invoices);

  invoice = signal<any | null>(null);

  async ngOnInit() {
    const invoiceId = this.route.snapshot.paramMap.get('invoiceId');
    if (!invoiceId) {
      this.close();
      return;
    }

    try {
      const data = await this.invoicesService.getInvoice(invoiceId);
      this.invoice.set(data);
      // Wait for view to update then print
      setTimeout(() => {
        window.print();
        // Optional: auto-close or go back after print
        // window.onafterprint = () => this.close();
      }, 500);
    } catch (error) {
      console.error('Error loading invoice:', error);
      this.close();
    }
  }

  close() {
    // If opened in new tab, close it. Otherwise go back.
    if (window.history.length > 1) {
      this.router.navigate(['/invoices/detail', this.invoice()?.id]);
    } else {
      window.close();
    }
  }
}
