import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Inventory as InventoryService } from '@app/core/services/inventory';
import { Supabase } from '@app/core/services/supabase';
import {
    ColumnConfig,
    DynamicTable,
    FilterConfig,
} from '@app/shared/components/dynamic-table/dynamic-table';
import { from, switchMap } from 'rxjs';

@Component({
  selector: 'app-movements',
  standalone: true,
  imports: [CommonModule, DynamicTable],
  templateUrl: './movements.html',
  styleUrl: './movements.css',
})
export class Movements {
  private inventoryService = inject(InventoryService);
  private supabase = inject(Supabase);

  // Reactive branch ID from logged in user profile
  private branchId = computed(() => this.supabase.userProfile()?.branch_id || '');

  // Raw data from service (all movements)
  private movementsRaw = toSignal(
    toObservable(this.branchId).pipe(
      switchMap((bid) => {
        if (!bid) return from(Promise.resolve([]));
        return from(this.inventoryService.getAllMovements(bid));
      }),
    ),
    { initialValue: [] },
  );

  movements = computed(() => this.movementsRaw() || []);

  columns: ColumnConfig[] = [
    { key: 'created_at', label: 'Fecha', type: 'date', sortable: true },
    { key: 'item_name', label: 'Insumo', type: 'text', sortable: true },
    {
      key: 'movement_type',
      label: 'Tipo',
      type: 'badge',
      badgeColors: {
        purchase: 'badge-active', // Green-ish
        consumption: 'bg-blue-100 text-blue-800',
        waste: 'bg-red-100 text-red-800',
        adjustment: 'bg-amber-100 text-amber-800',
      },
    },
    { key: 'quantity_display', label: 'Cantidad', type: 'text' },
    { key: 'notes', label: 'Notas', type: 'text' },
  ];

  displayData = computed(() => {
    return this.movements().map((m: any) => ({
      ...m,
      item_name: m.inventory_item?.name || 'N/A',
      quantity_display: `${m.quantity} ${m.inventory_item?.unit || ''}`,
    }));
  });

  filters: FilterConfig[] = [
    {
      key: 'movement_type',
      label: 'Filtrar por Tipo',
      type: 'select',
      options: [
        { label: 'Compra', value: 'purchase' },
        { label: 'Consumo', value: 'consumption' },
        { label: 'Desperdicio', value: 'waste' },
        { label: 'Ajuste', value: 'adjustment' },
      ],
    },
  ];
}
