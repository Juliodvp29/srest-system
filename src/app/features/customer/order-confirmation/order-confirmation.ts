import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CustomerService } from '@app/core/services/customer';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-confirmation.html',
  styleUrl: './order-confirmation.css',
})
export class OrderConfirmation {
  public customerService = inject(CustomerService);
  private router = inject(Router);

  viewStatus() {
    const orderId = this.customerService.orderId();
    if (orderId) {
      this.router.navigate(['/customer/order-status', orderId]);
    } else {
      this.router.navigate(['/customer/menu', this.customerService.activeTableId() || 'unknown']);
    }
  }
}
