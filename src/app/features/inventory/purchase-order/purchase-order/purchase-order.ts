import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AlertService } from '@app/core/services/alert';
import { Inventory as InventoryService } from '@app/core/services/inventory';
import { Supabase } from '@app/core/services/supabase';
import { ColumnConfig, DynamicTable } from '@shared/components/dynamic-table/dynamic-table';
import { from, switchMap } from 'rxjs';

@Component({
  selector: 'app-purchase-order',
  imports: [CommonModule, ReactiveFormsModule, DynamicTable],
  templateUrl: './purchase-order.html',
  styleUrl: './purchase-order.css',
})
export class PurchaseOrder {
  private fb = inject(FormBuilder);
  private inventoryService = inject(InventoryService);
  private supabase = inject(Supabase);
  private alertService = inject(AlertService);

  isLoading = signal(false);
  refreshTrigger = signal(0);

  // Reactive branch ID from logged in user profile
  private branchId = computed(() => this.supabase.userProfile()?.branch_id || '');

  // Available Inventory Items
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

  // Recent Purchases for the branch
  private recentPurchasesRaw = toSignal(
    toObservable(computed(() => ({ bid: this.branchId(), t: this.refreshTrigger() }))).pipe(
      switchMap(({ bid }) => {
        if (!bid) return from(Promise.resolve([]));
        return from(this.inventoryService.getAllMovements(bid, 10));
      }),
    ),
    { initialValue: [] },
  );

  recentPurchases = computed(() => {
    return this.recentPurchasesRaw()
      .filter((m: any) => m.movement_type === 'purchase')
      .map((m: any) => ({
        ...m,
        item_name: m.inventory_item?.name || 'Insumo',
        quantity_display: `${m.quantity} ${m.inventory_item?.unit || ''}`,
      }));
  });

  purchaseForm = this.fb.group({
    inventory_item_id: ['', [Validators.required]],
    quantity: [0, [Validators.required, Validators.min(0.0001)]],
    notes: [''],
  });

  columns: ColumnConfig[] = [
    { key: 'created_at', label: 'Fecha', type: 'date' },
    { key: 'item_name', label: 'Insumo', type: 'text' },
    { key: 'quantity_display', label: 'Cantidad Entrante', type: 'text' },
    { key: 'notes', label: 'Notas', type: 'text' },
  ];

  async onSubmit() {
    if (this.purchaseForm.invalid) return;

    this.isLoading.set(true);
    try {
      const formValue = this.purchaseForm.getRawValue();
      await this.inventoryService.registerPurchase(
        formValue.inventory_item_id!,
        formValue.quantity!,
        formValue.notes || undefined,
      );

      this.alertService.success('Compra registrada', 'El stock ha sido actualizado correctamente.');
      this.purchaseForm.reset({ quantity: 0 });
      this.refreshTrigger.update((v) => v + 1);
    } catch (err: any) {
      this.alertService.error('Error', err.message || 'No se pudo registrar la compra.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
