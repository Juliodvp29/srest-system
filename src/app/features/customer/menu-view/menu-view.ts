import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Category, Product, Table } from '@app/core/models/database.types';
import { AlertService } from '@app/core/services/alert';
import { CustomerService } from '@app/core/services/customer';
import { Products } from '@app/core/services/products';
import { Tables } from '@app/core/services/tables';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-menu-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu-view.html',
  styleUrl: './menu-view.css',
})
export class MenuView implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productsService = inject(Products);
  private tablesService = inject(Tables);
  public customerService = inject(CustomerService);
  private alertService = inject(AlertService);

  // State
  categories = signal<Category[]>([]);
  products = signal<Product[]>([]);
  table = signal<Table | null>(null);
  selectedCategoryId = signal<string>('all');
  isLoading = signal<boolean>(true);

  // Filtered Products
  filteredProducts = computed(() => {
    const categoryId = this.selectedCategoryId();
    const allProducts = this.products();
    if (categoryId === 'all') return allProducts;
    return allProducts.filter((p) => p.category_id === categoryId);
  });

  async ngOnInit() {
    this.route.paramMap.subscribe(async (params) => {
      const tableId = params.get('tableId');
      if (tableId && tableId !== 'unknown') {
        const tableData = await this.tablesService.getTableById(tableId);
        this.customerService.setTable(tableData);
        await this.loadData(tableId);
      } else {
        // Handle scanning without table (maybe choose branch first or show general menu)
        await this.loadData();
      }
    });
  }

  async loadData(tableId?: string) {
    this.isLoading.set(true);
    try {
      if (tableId) {
        const tableData = await this.tablesService.getTableById(tableId);
        this.table.set(tableData);
      }

      const [cats, prods] = await Promise.all([
        lastValueFrom(this.productsService.getAllCategories()),
        lastValueFrom(this.productsService.getAllProducts()),
      ]);

      this.categories.set(cats);
      this.products.set(prods);
    } catch (error) {
      console.error('Error loading menu data', error);
      this.alertService.error('Error', 'No se pudo cargar el menú.');
    } finally {
      this.isLoading.set(false);
    }
  }

  selectCategory(id: string) {
    this.selectedCategoryId.set(id);
  }

  addToCart(product: Product) {
    this.customerService.addToCart(product);
    // Subtle feedback? Maybe a micro-animation or small snackbar
  }

  goToCart() {
    this.router.navigate(['/customer/cart']);
  }
}
