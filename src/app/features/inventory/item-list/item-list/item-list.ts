import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { InventoryItem } from '@app/core/models/Inventory';
import { AlertService } from '@app/core/services/alert';
import { Inventory as InventoryService } from '@app/core/services/inventory';
import { Supabase } from '@app/core/services/supabase';
import { ConfirmationModal } from '@shared/components/confirmation-modal/confirmation-modal';
import {
  ActionButton,
  ColumnConfig,
  DynamicTable,
  FilterConfig,
} from '@shared/components/dynamic-table/dynamic-table';
import { Modal } from '@shared/components/modal/modal';
import { switchMap } from 'rxjs';
import { ItemForm } from '../item-form/item-form';

@Component({
  selector: 'app-item-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DynamicTable, Modal, ItemForm, ConfirmationModal],
  templateUrl: './item-list.html',
  styleUrl: './item-list.css',
})
export class ItemList {
  private inventoryService = inject(InventoryService);
  private supabase = inject(Supabase);
  private alertService = inject(AlertService);

  // Modal State
  isModalOpen = signal(false);
  selectedItem = signal<InventoryItem | null>(null);

  // State for Delete Confirmation
  isDeleteModalOpen = signal(false);
  itemToDelete = signal<InventoryItem | null>(null);

  // Refresh Trigger
  private refreshTrigger = signal<number>(0);

  // Reactive branch ID from logged in user profile
  private branchId = computed(() => this.supabase.userProfile()?.branch_id || '');

  // Raw data from service
  private itemsRaw = toSignal(
    toObservable(this.refreshTrigger).pipe(
      switchMap(() => {
        const bid = this.branchId();
        if (!bid) return Promise.resolve([]);
        return this.inventoryService.getAllInventoryItems(bid);
      }),
    ),
    { initialValue: [] },
  );

  items = computed(() => this.itemsRaw());

  columns: ColumnConfig[] = [
    { key: 'name', label: 'Insumo / Nombre', type: 'text', sortable: true },
    { key: 'unit', label: 'Unidad', type: 'text', sortable: true },
    { key: 'current_stock', label: 'Stock Actual', type: 'text', sortable: true },
    { key: 'min_stock', label: 'Stock Mínimo', type: 'text' },
    { key: 'cost_per_unit', label: 'Costo Unitario', type: 'currency', sortable: true },
    {
      key: 'stock_status',
      label: 'Estado Stock',
      type: 'badge',
      badgeColors: {
        Normal: 'badge-active',
        Bajo: 'badge-inactive',
        'Sin Stock': 'bg-red-100 text-red-800',
      },
    },
  ];

  // Enhanced data for display
  displayData = computed(() => {
    return this.items().map((item) => ({
      ...item,
      stock_status:
        item.current_stock <= 0
          ? 'Sin Stock'
          : item.current_stock <= item.min_stock
            ? 'Bajo'
            : 'Normal',
    }));
  });

  actions: ActionButton[] = [
    {
      label: 'Editar',
      icon: 'edit',
      onClick: (item) => this.openEditModal(item),
    },
    {
      label: 'Eliminar',
      icon: 'delete',
      onClick: (item) => this.openDeleteModal(item),
      class:
        'size-9 flex items-center justify-center bg-red-50 dark:bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 transition-all rounded-lg',
    },
  ];

  filters: FilterConfig[] = [
    {
      key: 'unit',
      label: 'Filtrar por Unidad',
      type: 'select',
      options: [
        { label: 'Unidades', value: 'und' },
        { label: 'Kilogramos', value: 'kg' },
        { label: 'Gramos', value: 'gr' },
        { label: 'Litros', value: 'lt' },
        { label: 'Mililitros', value: 'ml' },
      ],
    },
  ];

  openCreateModal() {
    this.selectedItem.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(item: InventoryItem) {
    this.selectedItem.set(item);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  onItemSaved() {
    this.closeModal();
    this.refreshTrigger.update((v) => v + 1);
  }

  openDeleteModal(item: InventoryItem) {
    this.itemToDelete.set(item);
    this.isDeleteModalOpen.set(true);
  }

  async confirmDelete() {
    const item = this.itemToDelete();
    if (!item) return;

    try {
      await this.inventoryService.deleteInventoryItem(item.id);
      this.alertService.success('Insumo eliminado', `El insumo "${item.name}" ha sido eliminado.`);
      this.refreshTrigger.update((v) => v + 1);
    } catch (err: any) {
      console.error('Error deleting inventory item:', err);
      this.alertService.error('Error', err.message || 'No se pudo eliminar el insumo.');
    } finally {
      this.isDeleteModalOpen.set(false);
      this.itemToDelete.set(null);
    }
  }
}
