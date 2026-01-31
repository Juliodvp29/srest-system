import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Product } from '@app/core/models/database.types';
import { AlertService } from '@app/core/services/alert';
import { Products } from '@app/core/services/products';
import { ConfirmationModal } from '@shared/components/confirmation-modal/confirmation-modal';
import {
  ActionButton,
  ColumnConfig,
  DynamicTable,
  FilterConfig,
} from '@shared/components/dynamic-table/dynamic-table';
import { Modal } from '@shared/components/modal/modal';
import { switchMap } from 'rxjs';
import { ProductForm } from '../product-form/product-form';

@Component({
  selector: 'app-product-list',
  imports: [DynamicTable, Modal, ProductForm, ConfirmationModal],
  templateUrl: './product-list.html',
  styleUrl: './product-list.css',
})
export class ProductList {
  private productService = inject(Products);
  private alertService = inject(AlertService);

  // State for Modal
  isModalOpen = signal(false);
  selectedProduct = signal<Product | null>(null);

  // State for Delete Confirmation
  isDeleteModalOpen = signal(false);
  productToDelete = signal<any>(null);

  // Refresh Trigger
  private refreshTrigger = signal<number>(0);

  // Raw data from service
  private productsRaw = toSignal(
    toObservable(this.refreshTrigger).pipe(switchMap(() => this.productService.getAllProducts())),
    { initialValue: [] },
  );

  // Categories for filter
  private categoriesRaw = toSignal(this.productService.getAllCategories(), { initialValue: [] });

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
        true: 'badge-active',
        false: 'badge-inactive',
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
      onClick: (p) => this.openDeleteModal(p),
      class:
        'size-9 flex items-center justify-center bg-red-50 dark:bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 transition-all rounded-lg',
    },
  ];

  productFilters = computed<FilterConfig[]>(() => [
    {
      key: 'category_id',
      label: 'Categoría',
      type: 'select',
      options: this.categoriesRaw().map((c) => ({ label: c.name, value: c.id })),
    },
    {
      key: 'is_available',
      label: 'Disponibilidad',
      type: 'select',
      options: [
        { label: 'Disponible', value: true },
        { label: 'Agotado', value: false },
      ],
    },
  ]);

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
    this.refreshTrigger.update((v) => v + 1);
  }

  openDeleteModal(product: any) {
    this.productToDelete.set(product);
    this.isDeleteModalOpen.set(true);
  }

  async confirmDelete() {
    const product = this.productToDelete();
    if (!product) return;

    try {
      await this.productService.deleteProduct(product.id).toPromise();
      this.alertService.success(
        'Producto eliminado',
        `El producto "${product.name}" ha sido eliminado.`,
      );
      this.refreshTrigger.update((v) => v + 1);
    } catch (err: any) {
      console.error('Error deleting:', err);
      this.alertService.error(
        'Error al eliminar',
        err.message || 'No se pudo eliminar el producto.',
      );
    } finally {
      this.isDeleteModalOpen.set(false);
      this.productToDelete.set(null);
    }
  }
}
