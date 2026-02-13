import { ChangeDetectionStrategy, Component, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { Storages } from '@app/core/services/storages';

@Component({
  selector: 'app-product-image-upload',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  templateUrl: './product-image-upload.html',
  styleUrl: './product-image-upload.css',
})
export class ProductImageUpload implements OnInit {
  private storages = inject(Storages);

  // Inputs
  initialImageUrl = input<string | null>(null);
  productId = input<string | null>(null);

  // Outputs
  imageUploaded = output<string>();
  imageRemoved = output<void>();

  // State
  previewUrl = signal<string | null>(null);
  isUploading = signal(false);
  errorMessage = signal<string | null>(null);

  constructor() {
    // Sync preview with initial image reactively
    effect(() => {
      const initial = this.initialImageUrl();
      if (initial) {
        this.previewUrl.set(initial);
      }
    });
  }

  ngOnInit() {}

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    this.errorMessage.set(null);

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl.set(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    this.isUploading.set(true);

    try {
      let finalUrl: string;

      if (this.productId()) {
        // Direct upload for existing product
        finalUrl = await this.storages.uploadProductImage(file, this.productId()!);
      } else {
        // Temp upload for new product
        finalUrl = await this.storages.uploadTempImage(file);
      }

      // We DON'T set previewUrl here anymore because we already set it to the local base64
      // This avoids the "flicker" or "broken image" if the public URL isn't ready or accessible
      this.imageUploaded.emit(finalUrl);
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Error al subir la imagen');
      console.error('Upload error:', error);
      this.previewUrl.set(null); // Clear local preview on error
    } finally {
      this.isUploading.set(false);
      input.value = '';
    }
  }

  removeImage() {
    this.previewUrl.set(null);
    this.imageRemoved.emit();
    this.errorMessage.set(null);
  }
}
