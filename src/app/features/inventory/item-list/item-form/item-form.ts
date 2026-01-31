import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InventoryItem } from '@app/core/models/Inventory';
import { AlertService } from '@app/core/services/alert';
import { Inventory as InventoryService } from '@app/core/services/inventory';
import { Supabase } from '@app/core/services/supabase';

@Component({
  selector: 'app-item-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './item-form.html',
  styleUrl: './item-form.css',
})
export class ItemForm {
  private fb = inject(FormBuilder);
  private inventoryService = inject(InventoryService);
  private supabase = inject(Supabase);
  private alertService = inject(AlertService);

  initialData = input<InventoryItem | null>(null);
  onSaved = output<void>();
  onCancel = output<void>();

  isLoading = signal(false);

  itemForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    unit: ['und', [Validators.required]],
    current_stock: [0, [Validators.required, Validators.min(0)]],
    min_stock: [0, [Validators.required, Validators.min(0)]],
    cost_per_unit: [0, [Validators.required, Validators.min(0)]],
    branch_id: ['', [Validators.required]],
  });

  constructor() {
    effect(() => {
      const data = this.initialData();
      if (data) {
        this.itemForm.patchValue(data);
      } else {
        this.itemForm.reset({
          unit: 'und',
          current_stock: 0,
          min_stock: 0,
          cost_per_unit: 0,
          branch_id: this.supabase.userProfile()?.branch_id || '',
        });
      }
    });
  }

  async onSubmit() {
    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const formValue = this.itemForm.getRawValue();
    const isEdit = !!this.initialData();

    try {
      if (isEdit) {
        await this.inventoryService.updateInventoryItem(this.initialData()!.id, formValue as any);
        this.alertService.success('Éxito', 'Insumo actualizado correctamente.');
      } else {
        await this.inventoryService.createInventoryItem(formValue as any);
        this.alertService.success('Éxito', 'Nuevo insumo registrado.');
      }
      this.onSaved.emit();
    } catch (error: any) {
      console.error('Error in inventory item process:', error);
      this.alertService.error('Error', error.message || 'Ocurrió un error inesperado.');
    } finally {
      this.isLoading.set(false);
    }
  }
}
