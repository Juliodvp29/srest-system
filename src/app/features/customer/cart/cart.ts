import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AlertService } from '@app/core/services/alert';
import { CustomerService } from '@app/core/services/customer';
import { Supabase } from '@app/core/services/supabase';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart {
  public customerService = inject(CustomerService);
  private supabase = inject(Supabase);
  private router = inject(Router);
  private alertService = inject(AlertService);

  isSubmitting = signal<boolean>(false);
  hasSubmitted = signal<boolean>(false);

  goBack() {
    const tableId = this.customerService.activeTableId() || 'unknown';
    this.router.navigate(['/customer/menu', tableId]);
  }

  async submitOrder() {
    if (this.isSubmitting() || this.hasSubmitted()) return;

    this.isSubmitting.set(true);
    try {
      await this.customerService.submitOrder();
      this.hasSubmitted.set(true);

      this.alertService.success(
        '¡Pedido Enviado!',
        'Tu pedido está en cocina. Estará listo en aproximadamente 15-20 minutos.',
      );

      // Delay redirect slightly to ensure state is clean and user sees the toast
      setTimeout(() => {
        this.router.navigate(['/customer/order-confirmation']);
      }, 1000);
    } catch (error) {
      console.error('Error submitting order', error);
      this.alertService.error('Error', 'No se pudo enviar el pedido.');
      this.isSubmitting.set(false);
    } finally {
      // We don't set isSubmitting to false here if successful to prevent accidental double clicks
      // or view jumps, the hasSubmitted handles the view state.
    }
  }
}
