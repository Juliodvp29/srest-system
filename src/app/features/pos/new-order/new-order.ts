import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Category, Product, Table } from '@app/core/models/database.types';
import { AlertService } from '@app/core/services/alert';
import { Orders } from '@app/core/services/orders';
import { PosService } from '@app/core/services/pos';
import { Products } from '@app/core/services/products';
import { Supabase } from '@app/core/services/supabase';
import { Tables } from '@app/core/services/tables';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-new-order',
  imports: [CommonModule, FormsModule],
  templateUrl: './new-order.html',
  styleUrl: './new-order.css',
})
export class NewOrder implements OnInit, OnDestroy {
  // Injects
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productsService = inject(Products);
  private ordersService = inject(Orders);
  private tablesService = inject(Tables);
  private supabase = inject(Supabase);
  public posService = inject(PosService);
  private alertService = inject(AlertService);

  // State
  tableId = signal<string>('');
  table = signal<Table | null>(null);
  categories = signal<Category[]>([]);
  products = signal<Product[]>([]);
  selectedCategoryId = signal<string>('all');
  searchQuery = signal<string>('');
  isLoading = signal<boolean>(true);
  isSending = signal<boolean>(false);

  // Branch info
  branchId = '';

  // Computed
  filteredProducts = computed(() => {
    let result = this.products();

    // Filter by category
    if (this.selectedCategoryId() !== 'all') {
      result = result.filter((p) => p.category_id === this.selectedCategoryId());
    }

    // Filter by search
    const query = this.searchQuery().toLowerCase();
    if (query) {
      result = result.filter((p) => p.name.toLowerCase().includes(query));
    }

    return result;
  });

  async ngOnInit() {
    this.branchId = this.supabase.userProfile()?.branch_id || '';

    this.route.paramMap.subscribe(async (params) => {
      const id = params.get('tableId');
      if (id) {
        this.tableId.set(id);
        this.posService.setActiveTable(id);
        await this.loadData(id);
      }
    });

    // Reset cart when entering new table?
    // Usually yes, unless we persist cart per table.
    // For now, let's clear cart if it's a new order flow.
    // If there is an existing order, we should probably redirect to order-detail (handled in tables-view).
    // But if we are adding items to an existing order, that would be a different flow or handled here too?
    // User requirement: "/pos/new-order/:tableId - Crear nuevo pedido"
    // So assume this is for creating new.
    this.posService.clearCart();
  }

  ngOnDestroy() {
    // Cleanup
  }

  async loadData(tableId: string) {
    this.isLoading.set(true);
    try {
      // Load table info
      const table = await this.tablesService.getTableById(tableId);
      this.table.set(table);

      // Load products and categories concurrently
      const [cats, prods] = await Promise.all([
        lastValueFrom(this.productsService.getAllCategories()),
        lastValueFrom(this.productsService.getAllProducts()),
      ]);

      this.categories.set(cats);
      this.products.set(prods);
    } catch (err) {
      console.error('Error loading POS data:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  selectCategory(id: string) {
    this.selectedCategoryId.set(id);
  }

  addToCart(product: Product) {
    this.posService.addToCart(product);
  }

  async sendOrder() {
    if (this.posService.cart().length === 0) return;
    if (this.isSending()) return;

    this.isSending.set(true);
    try {
      // 1. Create Order
      const newOrder = await this.ordersService.createOrder({
        branch_id: this.branchId,
        table_id: this.tableId(),
        status: 'pending',
        order_type: 'dine_in',
        total: this.posService.cartTotal(),
        notes: '',
      });

      // 2. Create Order Items
      const cartItems = this.posService.cart();
      for (const item of cartItems) {
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
      await this.tablesService.occupyTable(this.tableId());

      this.alertService.success('Éxito', 'Pedido creado correctamente');

      // 4. Navigate to order detail
      this.router.navigate(['/pos/order-detail', newOrder.id]);
    } catch (err) {
      console.error('Error creating order:', err);
      this.alertService.error('Error', 'Error al crear el pedido. Intente nuevamente.');
    } finally {
      this.isSending.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/pos/tables']);
  }
}
