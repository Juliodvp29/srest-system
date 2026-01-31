import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Category } from '@app/core/models/database.types';
import { AlertService } from '@app/core/services/alert';
import { Products } from '@app/core/services/products';

@Component({
  selector: 'app-categories-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './categories-form.html',
  styleUrl: './categories-form.css',
})
export class CategoriesForm {
  private fb = inject(FormBuilder);
  private productService = inject(Products);
  private alertService = inject(AlertService);

  // Inputs
  initialData = input<Category | null>(null);

  // Outputs
  onSaved = output<void>();
  onCancel = output<void>();

  // State
  isLoading = signal(false);

  categoryForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    display_order: [0, [Validators.required, Validators.min(0)]],
    is_active: [true],
  });

  constructor() {
    // Reactively patch form when initialData changes
    effect(() => {
      const data = this.initialData();
      if (data) {
        this.categoryForm.patchValue({
          name: data.name,
          description: data.description || '',
          display_order: data.display_order,
          is_active: data.is_active,
        });
      } else {
        // Reset form if data is null (Create Mode)
        this.categoryForm.reset({
          name: '',
          description: '',
          display_order: 0,
          is_active: true,
        });
      }
    });
  }

  async onSubmit() {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const formData = this.categoryForm.getRawValue();
    const data = this.initialData();

    try {
      let payload = formData as Partial<Category>;

      if (data?.id) {
        // Update
        await this.productService.updateCategory(data.id, payload).toPromise();
      } else {
        // Create
        await this.productService.createCategory(payload).toPromise();
      }

      this.alertService.success(
        data?.id ? 'Categoría actualizada' : 'Categoría creada',
        `La categoría "${payload.name}" se ha guardado correctamente.`,
      );
      this.onSaved.emit();
    } catch (err: any) {
      console.error('Error saving category:', err);
      this.alertService.error(
        'Error al guardar',
        err.message || 'No se pudo guardar la categoría.',
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  cancel() {
    this.onCancel.emit();
  }
}
