import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Product } from '@app/core/models/database.types';
import { Products } from '@app/core/services/products';
import {
  ActionButton,
  ColumnConfig,
  DynamicTable,
} from '../../../../shared/components/dynamic-table/dynamic-table';
import { Modal } from '../../../../shared/components/modal/modal';
import { ProductForm } from '../product-form/product-form';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [DynamicTable, Modal, ProductForm],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductList {
  private productService = inject(Products);

  // State for Modal
  isModalOpen = signal(false);
  selectedProduct = signal<Product | null>(null);

  // Raw data from service
  private productsRaw = toSignal(this.productService.getAllProducts(), { initialValue: [] });

  // Flattened data for the table
  products = computed(() => {
    return this.productsRaw().map((p) => ({
      ...p,
      category_name: p.categories?.name || 'Sin categoría',
    }));
  });

  productColumns: ColumnConfig[] = [
    { key: 'image_url', label: 'Producto', type: 'image' },
    { key: 'category_name', label: 'Categoría', type: 'text', sortable: true },
    { key: 'price', label: 'Precio', type: 'currency', sortable: true },
    {
      key: 'is_available',
      label: 'Estado',
      type: 'badge',
      badgeColors: {
        true: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
        false: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
      },
    },
  ];

  productActions: ActionButton[] = [
    {
      label: 'Editar',
      icon: 'edit',
      onClick: (p) => this.openEditModal(p),
      class:
        'size-9 flex items-center justify-center bg-slate-100 dark:bg-white/5 hover:bg-primary hover:text-background-dark text-slate-500 transition-all rounded-lg',
    },
    {
      label: 'Eliminar',
      icon: 'delete',
      onClick: (p) => this.deleteProduct(p),
      class:
        'size-9 flex items-center justify-center bg-red-50 dark:bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 transition-all rounded-lg',
    },
  ];

  openCreateModal() {
    this.selectedProduct.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(product: any) {
    this.selectedProduct.set(product);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  onProductSaved() {
    this.closeModal();
    // In a reactive app using signals/observables connected to the service,
    // we would ideally trigger a refresh or use a more reactive cache.
    // For now, let's keep it simple.
    location.reload(); // Temporary measure until we implement event-based refresh
  }

  async deleteProduct(product: any) {
    if (confirm(`¿Estás seguro de eliminar ${product.name}?`)) {
      try {
        await this.productService.deleteProduct(product.id).toPromise();
        location.reload();
      } catch (err) {
        console.error('Error deleting:', err);
      }
    }
  }
}
