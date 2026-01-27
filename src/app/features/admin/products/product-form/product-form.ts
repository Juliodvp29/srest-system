import { CommonModule } from '@angular/common';
import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Product } from '@app/core/models/database.types';
import { Products } from '@app/core/services/products';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-form.html',
  styleUrl: './product-form.css',
})
export class ProductForm implements OnInit {
  private fb = inject(FormBuilder);
  private productService = inject(Products);

  // Inputs
  initialData = input<Product | null>(null);

  // Outputs
  onSaved = output<void>();
  onCancel = output<void>();

  // State
  isLoading = signal(false);
  categories = toSignal(this.productService.getAllCategories(), { initialValue: [] });

  productForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    price: [0, [Validators.required, Validators.min(0)]],
    category_id: ['', [Validators.required]],
    image_url: [''],
    preparation_time: [15, [Validators.required, Validators.min(1)]],
    is_available: [true],
  });

  ngOnInit() {
    const data = this.initialData();
    if (data) {
      this.productForm.patchValue({
        name: data.name,
        description: data.description || '',
        price: data.price,
        category_id: data.category_id || '',
        image_url: data.image_url || '',
        preparation_time: data.preparation_time,
        is_available: data.is_available,
      });
    }
  }

  async onSubmit() {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const formData = this.productForm.getRawValue();
    const data = this.initialData();

    try {
      const payload = formData as Partial<Product>;
      if (data?.id) {
        // Update
        await this.productService.updateProduct(data.id, payload).toPromise();
      } else {
        // Create
        await this.productService.createProduct(payload).toPromise();
      }
      this.onSaved.emit();
    } catch (err) {
      console.error('Error saving product:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  cancel() {
    this.onCancel.emit();
  }
}
