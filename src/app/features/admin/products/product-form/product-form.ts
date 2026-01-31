import { CommonModule } from '@angular/common';
import { Component, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Product } from '@app/core/models/database.types';
import { Products } from '@app/core/services/products';
import { Storages } from '@app/core/services/storages';
import { ProductImageUpload } from '../product-image-upload/product-image-upload';

import { AlertService } from '@app/core/services/alert';

@Component({
  selector: 'app-product-form',
  imports: [CommonModule, ReactiveFormsModule, ProductImageUpload],
  templateUrl: './product-form.html',
  styleUrl: './product-form.css',
})
export class ProductForm implements OnInit {
  private fb = inject(FormBuilder);
  private productService = inject(Products);
  private storages = inject(Storages);
  private alertService = inject(AlertService);

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

  constructor() {
    // Reactively patch form when initialData changes
    effect(() => {
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
      } else {
        // Reset form if data is null (Create Mode)
        this.productForm.reset({
          name: '',
          description: '',
          price: 0,
          category_id: '',
          image_url: '',
          preparation_time: 15,
          is_available: true,
        });
      }
    });
  }

  ngOnInit() {}

  async onSubmit() {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const formData = this.productForm.getRawValue();
    const data = this.initialData();

    try {
      let payload = formData as Partial<Product>;
      let productResult: any;

      if (data?.id) {
        // Update
        productResult = await this.productService.updateProduct(data.id, payload).toPromise();
      } else {
        // Create
        productResult = await this.productService.createProduct(payload).toPromise();

        // If it was a temp image, move it to the final entity folder
        if (
          payload.image_url &&
          payload.image_url.includes('/storage/v1/object/public/restaurant-images/temp/')
        ) {
          const finalImageUrl = await this.storages.moveTempImageToEntity(
            payload.image_url,
            'product',
            productResult.id,
          );

          // Update product one last time with the final image URL
          await this.productService
            .updateProduct(productResult.id, { image_url: finalImageUrl })
            .toPromise();
        }
      }
      this.alertService.success(
        data?.id ? 'Producto actualizado' : 'Producto creado',
        `El producto "${payload.name}" se ha guardado correctamente.`,
      );
      this.onSaved.emit();
    } catch (err: any) {
      console.error('Error saving product:', err);
      this.alertService.error('Error al guardar', err.message || 'No se pudo guardar el producto.');
    } finally {
      this.isLoading.set(false);
    }
  }

  onImageUploaded(url: string) {
    this.productForm.patchValue({ image_url: url });
  }

  onImageRemoved() {
    this.productForm.patchValue({ image_url: '' });
  }

  cancel() {
    this.onCancel.emit();
  }
}
