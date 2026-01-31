import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AlertService } from '@app/core/services/alert';
import { Inventory as InventoryService } from '@app/core/services/inventory';
import { Products as ProductService } from '@app/core/services/products';
import { Supabase } from '@app/core/services/supabase';
import { ConfirmationModal } from '@shared/components/confirmation-modal/confirmation-modal';
import {
  ActionButton,
  ColumnConfig,
  DynamicTable,
} from '@shared/components/dynamic-table/dynamic-table';
import { Modal } from '@shared/components/modal/modal';
import { from, switchMap } from 'rxjs';

@Component({
  selector: 'app-recipes',
  imports: [CommonModule, DynamicTable, Modal, ReactiveFormsModule, ConfirmationModal],
  templateUrl: './recipes.html',
  styleUrl: './recipes.css',
})
export class Recipes {
  private productService = inject(ProductService);
  private inventoryService = inject(InventoryService);
  private supabase = inject(Supabase);
  private alertService = inject(AlertService);
  private fb = inject(FormBuilder);

  // Selected state
  selectedProductId = signal<string | null>(null);
  isModalOpen = signal(false);
  isLoadingModal = signal(false);

  // State for Delete Confirmation
  isDeleteModalOpen = signal(false);
  ingredientToDelete = signal<any>(null);

  // Reactive branch ID from logged in user profile
  private branchId = computed(() => this.supabase.userProfile()?.branch_id || '');

  // Products List
  private productsRaw = toSignal(
    toObservable(this.branchId).pipe(
      switchMap((bid) => {
        if (!bid) return from(Promise.resolve([]));
        return this.productService.getAllProducts();
      }),
    ),
    { initialValue: [] },
  );

  products = computed(() => this.productsRaw());

  // Current Recipe for selected product
  private recipeRefreshTrigger = signal(0);
  private recipeRaw = toSignal(
    toObservable(
      computed(() => ({ id: this.selectedProductId(), trigger: this.recipeRefreshTrigger() })),
    ).pipe(
      switchMap(({ id }) => {
        if (!id) return from(Promise.resolve([]));
        return from(this.inventoryService.getRecipeByProduct(id));
      }),
    ),
    { initialValue: [] },
  );

  recipeIngredients = computed(() => this.recipeRaw());

  // Available Inventory Items for adding to recipe
  private inventoryItemsRaw = toSignal(
    toObservable(this.branchId).pipe(
      switchMap((bid) => {
        if (!bid) return from(Promise.resolve([]));
        return from(this.inventoryService.getAllInventoryItems(bid));
      }),
    ),
    { initialValue: [] },
  );

  inventoryItems = computed(() => this.inventoryItemsRaw());

  // Form for adding/editing recipe item
  recipeForm = this.fb.group({
    inventory_item_id: ['', [Validators.required]],
    quantity: [0, [Validators.required, Validators.min(0.0001)]],
  });

  // Table Configs
  productColumns: ColumnConfig[] = [
    { key: 'name', label: 'Producto', type: 'text', sortable: true },
    { key: 'category_name', label: 'Categoría', type: 'text' },
  ];

  ingredientColumns: ColumnConfig[] = [
    { key: 'item_name', label: 'Insumo', type: 'text' },
    { key: 'quantity_display', label: 'Cantidad', type: 'text' },
    { key: 'cost', label: 'Costo', type: 'currency' },
  ];

  ingredientActions: ActionButton[] = [
    {
      label: 'Eliminar',
      icon: 'delete',
      onClick: (item) => this.openDeleteModal(item),
      class:
        'size-8 flex items-center justify-center bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all',
    },
  ];

  // Derived Data
  totalCost = computed(() => {
    return this.recipeIngredients().reduce((acc, curr) => {
      const unitCost = curr.inventory_item?.cost_per_unit || 0;
      return acc + curr.quantity * unitCost;
    }, 0);
  });

  displayIngredients = computed(() => {
    return this.recipeIngredients().map((ri) => ({
      ...ri,
      item_name: ri.inventory_item?.name || 'N/A',
      quantity_display: `${ri.quantity} ${ri.inventory_item?.unit || ''}`,
      cost: ri.quantity * (ri.inventory_item?.cost_per_unit || 0),
    }));
  });

  // Handlers
  selectProduct(product: any) {
    this.selectedProductId.set(product.id);
  }

  openAddIngredient() {
    this.recipeForm.reset({ quantity: 0 });
    this.isModalOpen.set(true);
  }

  async onAddIngredient() {
    if (this.recipeForm.invalid || !this.selectedProductId()) return;

    this.isLoadingModal.set(true);
    try {
      const formValue = this.recipeForm.getRawValue();
      await this.inventoryService.createRecipe({
        product_id: this.selectedProductId()!,
        inventory_item_id: formValue.inventory_item_id!,
        quantity: formValue.quantity!,
      });

      this.alertService.success('Insumo añadido', 'La receta ha sido actualizada.');
      this.recipeRefreshTrigger.update((v) => v + 1);
      this.isModalOpen.set(false);
    } catch (err: any) {
      this.alertService.error('Error', err.message || 'No se pudo añadir el insumo.');
    } finally {
      this.isLoadingModal.set(false);
    }
  }

  openDeleteModal(ingredient: any) {
    this.ingredientToDelete.set(ingredient);
    this.isDeleteModalOpen.set(true);
  }

  async confirmDelete() {
    const ingredient = this.ingredientToDelete();
    if (!ingredient) return;

    try {
      await this.inventoryService.deleteRecipe(ingredient.id);
      this.alertService.success('Insumo eliminado', 'El insumo ha sido removido de la receta.');
      this.recipeRefreshTrigger.update((v) => v + 1);
    } catch (err: any) {
      console.error('Error deleting recipe item:', err);
      this.alertService.error('Error', err.message || 'No se pudo eliminar el insumo.');
    } finally {
      this.isDeleteModalOpen.set(false);
      this.ingredientToDelete.set(null);
    }
  }
}
