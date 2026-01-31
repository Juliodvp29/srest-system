import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { InventoryItem } from '@app/core/models/Inventory';
import { Inventory as InventoryService } from '@app/core/services/inventory';
import { Supabase } from '@app/core/services/supabase';
import { ColumnConfig, DynamicTable } from '@shared/components/dynamic-table/dynamic-table';
import { from, switchMap } from 'rxjs';

@Component({
  selector: 'app-low-stock',
  imports: [CommonModule, DynamicTable],
  templateUrl: './low-stock.html',
  styleUrl: './low-stock.css',
})
export class LowStock {
  private inventoryService = inject(InventoryService);
  private supabase = inject(Supabase);

  // Reactive branch ID from logged in user profile
  private branchId = computed(() => this.supabase.userProfile()?.branch_id || '');

  // Raw data from service (low stock items)
  private lowStockRaw = toSignal(
    toObservable(this.branchId).pipe(
      switchMap((bid) => {
        if (!bid) return from(Promise.resolve([]));
        return from(this.inventoryService.getLowStockItems(bid));
      }),
    ),
    { initialValue: [] },
  );

  lowStockItems = computed(() => (this.lowStockRaw() || []) as InventoryItem[]);

  columns: ColumnConfig[] = [
    { key: 'name', label: 'Insumo', type: 'text', sortable: true },
    { key: 'current_stock', label: 'Stock Actual', type: 'text', sortable: true },
    { key: 'min_stock', label: 'Stock Mínimo', type: 'text' },
    { key: 'unit', label: 'Unidad', type: 'text' },
    {
      key: 'urgency',
      label: 'Prioridad',
      type: 'badge',
      badgeColors: {
        Crítica: 'bg-red-100 text-red-800',
        Alta: 'badge-inactive',
      },
    },
  ];

  displayData = computed(() => {
    return this.lowStockItems().map((item: InventoryItem) => ({
      ...item,
      urgency: item.current_stock <= 0 ? 'Crítica' : 'Alta',
    }));
  });
}
