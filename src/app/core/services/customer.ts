import { computed, inject, Injectable, signal } from '@angular/core';
import { Product, Table } from '@app/core/models/database.types';
import { Orders } from './orders';
import { Tables } from './tables';

export interface CustomerCartItem {
  product: Product;
  quantity: number;
  notes?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  private ordersService = inject(Orders);
  private tablesService = inject(Tables);

  // State
  activeTableId = signal<string | null>(null);
  activeBranchId = signal<string | null>(null);
  cart = signal<CustomerCartItem[]>([]);
  orderId = signal<string | null>(null); // Current active order for this customer

  // Computed
  cartTotal = computed(() =>
    this.cart().reduce((sum, item) => sum + item.product.price * item.quantity, 0),
  );

  cartCount = computed(() => this.cart().reduce((sum, item) => sum + item.quantity, 0));

  constructor() {
    // Load from sessionStorage if available
    this.restoreSession();
  }

  setTable(table: Table) {
    this.activeTableId.set(table.id);
    this.activeBranchId.set(table.branch_id);
    sessionStorage.setItem('active_table_id', table.id);
    sessionStorage.setItem('active_branch_id', table.branch_id);
  }

  addToCart(product: Product) {
    this.cart.update((items) => {
      const existing = items.find((i) => i.product.id === product.id);
      if (existing) {
        return items.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...items, { product, quantity: 1 }];
    });
    this.saveCart();
  }

  removeFromCart(productId: string) {
    this.cart.update((items) => items.filter((i) => i.product.id !== productId));
    this.saveCart();
  }

  updateQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }
    this.cart.update((items) =>
      items.map((i) => (i.product.id === productId ? { ...i, quantity } : i)),
    );
    this.saveCart();
  }

  clearCart() {
    this.cart.set([]);
    sessionStorage.removeItem('customer_cart');
  }

  private saveCart() {
    sessionStorage.setItem('customer_cart', JSON.stringify(this.cart()));
  }

  private restoreSession() {
    const tableId = sessionStorage.getItem('active_table_id');
    const branchId = sessionStorage.getItem('active_branch_id');
    if (tableId) this.activeTableId.set(tableId);
    if (branchId) this.activeBranchId.set(branchId);

    const cartData = sessionStorage.getItem('customer_cart');
    if (cartData) {
      try {
        this.cart.set(JSON.parse(cartData));
      } catch (e) {
        console.error('Error restoring cart', e);
      }
    }
  }

  async submitOrder() {
    if (!this.activeTableId() || !this.activeBranchId() || this.cart().length === 0) {
      throw new Error('Table, Branch or Cart is missing');
    }

    try {
      // 1. Create Order
      const newOrder = await this.ordersService.createOrder({
        branch_id: this.activeBranchId()!,
        table_id: this.activeTableId()!,
        status: 'pending',
        order_type: 'dine_in',
        total: this.cartTotal(),
        notes: 'Pedido Web QR',
      });

      // 2. Add items
      for (const item of this.cart()) {
        await this.ordersService.addItemToOrder({
          order_id: newOrder.id,
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.product.price,
          subtotal: item.product.price * item.quantity,
          status: 'pending',
        });
      }

      // 3. Mark table occupied
      await this.tablesService.occupyTable(this.activeTableId()!);

      // Clear local state
      this.clearCart();
      this.orderId.set(newOrder.id);
      return newOrder;
    } catch (error) {
      console.error('Error submitting customer order:', error);
      throw error;
    }
  }
}
