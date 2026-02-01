import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { InventoryItem } from '@app/core/models/Inventory';
import { Inventory } from '@app/core/services/inventory';
import { Supabase } from '@app/core/services/supabase';
import { from, switchMap } from 'rxjs';

@Component({
  selector: 'app-low-stock-alert',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './low-stock-alert.html',
  styleUrl: './low-stock-alert.css',
})
export class LowStockAlert {
  private inventoryService = inject(Inventory);
  private supabase = inject(Supabase);

  private branchId = computed(() => this.supabase.userProfile()?.branch_id || '');

  refreshTrigger = signal(0);

  lowStockItems = toSignal(
    toObservable(computed(() => ({ bid: this.branchId(), t: this.refreshTrigger() }))).pipe(
      switchMap(({ bid }) => {
        if (!bid) return from(Promise.resolve([] as InventoryItem[]));
        console.log('[LowStockAlert] Fetching items for branch:', bid);
        return from(this.inventoryService.getLowStockItems(bid));
      }),
    ),
    { initialValue: [] as InventoryItem[] },
  );

  refresh() {
    this.refreshTrigger.update((v) => v + 1);
  }
}
