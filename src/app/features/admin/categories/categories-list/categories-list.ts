import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Category } from '@app/core/models/database.types';
import { AlertService } from '@app/core/services/alert';
import { Products } from '@app/core/services/products';
import { ConfirmationModal } from '@shared/components/confirmation-modal/confirmation-modal';
import {
  ActionButton,
  ColumnConfig,
  DynamicTable,
} from '@shared/components/dynamic-table/dynamic-table';
import { Modal } from '@shared/components/modal/modal';
import { switchMap } from 'rxjs';
import { CategoriesForm } from '../categories-form/categories-form';

@Component({
  selector: 'app-categories-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamicTable, Modal, CategoriesForm, ConfirmationModal],
  templateUrl: './categories-list.html',
  styleUrl: './categories-list.css',
})
export class CategoriesList {
  private productService = inject(Products);
  private alertService = inject(AlertService);

  // State for Modal
  isModalOpen = signal(false);
  selectedCategory = signal<Category | null>(null);

  // State for Delete Confirmation
  isDeleteModalOpen = signal(false);
  categoryToDelete = signal<Category | null>(null);

  // Refresh Trigger
  private refreshTrigger = signal<number>(0);

  // Raw data from service
  private categoriesRaw = toSignal(
    toObservable(this.refreshTrigger).pipe(switchMap(() => this.productService.getAllCategories())),
    { initialValue: [] },
  );

  // Computed data for the table (if transformation needed)
  categories = computed(() => {
    return this.categoriesRaw();
  });

  categoryColumns: ColumnConfig[] = [
    { key: 'name', label: 'Categoría', type: 'text', sortable: true },
    { key: 'description', label: 'Descripción', type: 'text' },
    // { key: 'display_order', label: 'Orden', type: 'text', sortable: true },
    {
      key: 'is_active',
      label: 'Estado',
      type: 'badge',
      badgeColors: {
        true: 'badge-active',
        false: 'badge-inactive',
      },
    },
  ];

  categoryActions: ActionButton[] = [
    {
      label: 'Editar',
      icon: 'edit',
      onClick: (item) => this.openEditModal(item),
      class:
        'size-9 flex items-center justify-center bg-slate-100 dark:bg-white/5 hover:bg-primary hover:text-background-dark text-slate-500 transition-all rounded-lg',
    },
    {
      label: 'Eliminar',
      icon: 'delete',
      onClick: (item) => this.openDeleteModal(item),
      class:
        'size-9 flex items-center justify-center bg-red-50 dark:bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 transition-all rounded-lg',
    },
  ];

  openCreateModal() {
    this.selectedCategory.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(category: Category) {
    this.selectedCategory.set(category);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  onCategorySaved() {
    this.closeModal();
    this.refreshTrigger.update((v) => v + 1);
  }

  openDeleteModal(category: Category) {
    this.categoryToDelete.set(category);
    this.isDeleteModalOpen.set(true);
  }

  async confirmDelete() {
    const category = this.categoryToDelete();
    if (!category) return;

    try {
      await this.productService.deleteCategory(category.id).toPromise();
      this.alertService.success(
        'Categoría eliminada',
        `La categoría "${category.name}" ha sido eliminada.`,
      );
      this.refreshTrigger.update((v) => v + 1);
    } catch (err: any) {
      console.error('Error deleting category:', err);
      this.alertService.error(
        'Error al eliminar',
        err.message || 'No se pudo eliminar la categoría.',
      );
    } finally {
      this.isDeleteModalOpen.set(false);
      this.categoryToDelete.set(null);
    }
  }
}
