import { computed, Injectable, signal } from '@angular/core';
import { Product } from '@app/core/models/database.types';

export interface CartItem {
  product: Product;
  quantity: number;
  modifiers?: any[];
  notes?: string;
  tempId: string; // unique ID for frontend handling
}

@Injectable({
  providedIn: 'root',
})
export class PosService {
  // State
  private _cart = signal<CartItem[]>([]);
  private _activeTableId = signal<string | null>(null);

  // Computed
  cart = computed(() => this._cart());

  cartTotal = computed(() => {
    return this._cart().reduce((total, item) => {
      let itemTotal = item.product.price * item.quantity;
      // Add modifier costs here if implemented
      return total + itemTotal;
    }, 0);
  });

  cartCount = computed(() => {
    return this._cart().reduce((count, item) => count + item.quantity, 0);
  });

  // Actions
  setActiveTable(tableId: string) {
    this._activeTableId.set(tableId);
  }

  addToCart(product: Product, quantity: number = 1, modifiers: any[] = [], notes: string = '') {
    this._cart.update((items) => {
      // Check if same product with same modifiers exists
      // For simplicity, checking just product ID for now, but should check modifiers too usually
      const existingItemIndex = items.findIndex(
        (item) =>
          item.product.id === product.id &&
          JSON.stringify(item.modifiers) === JSON.stringify(modifiers),
      );

      if (existingItemIndex >= 0) {
        const newItems = [...items];
        newItems[existingItemIndex].quantity += quantity;
        return newItems;
      }

      return [
        ...items,
        {
          product,
          quantity,
          modifiers,
          notes,
          tempId: crypto.randomUUID(),
        },
      ];
    });
  }

  updateQuantity(tempId: string, quantity: number) {
    this._cart.update((items) => {
      if (quantity <= 0) {
        return items.filter((i) => i.tempId !== tempId);
      }
      return items.map((i) => (i.tempId === tempId ? { ...i, quantity } : i));
    });
  }

  removeFromCart(tempId: string) {
    this._cart.update((items) => items.filter((i) => i.tempId !== tempId));
  }

  clearCart() {
    this._cart.set([]);
  }

  // Getters
  getActiveTableId() {
    return this._activeTableId();
  }
}
