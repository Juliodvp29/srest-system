import { inject, Injectable } from '@angular/core';
import { Supabase } from './supabase';

@Injectable({
  providedIn: 'root',
})
export class Storages {
  private readonly BUCKET_NAME = 'restaurant-images';

  private supabase = inject(Supabase);
  constructor() {}

  /**
   * Upload image organized by entity and ID
   * @param file - Image file
   * @param entityType - Entity type (product, employee, restaurant)
   * @param entityId - Entity ID
   * @param imageName - Specific name (main, profile, logo, etc.)
   */

  async uploadEntityImage(
    file: File,
    entityType: 'product' | 'employee' | 'restaurant',
    entityId: string,
    imageName: string = 'main',
  ): Promise<string> {
    try {
      // Validaciones
      if (!file.type.startsWith('image/')) {
        throw new Error('El archivo debe ser una imagen');
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new Error('La imagen no debe superar los 5MB');
      }

      // Determinar carpeta según tipo de entidad
      const folderMap = {
        product: 'product-images',
        employee: 'employee-photos',
        restaurant: 'restaurant-logos',
      };

      const folder = folderMap[entityType];

      // Extensión del archivo
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';

      // Ruta completa: folder/entityId/imageName.ext
      const filePath = `${folder}/${entityId}/${imageName}.${fileExt}`;

      console.log('Subiendo imagen a:', filePath);

      // Comprimir imagen primero
      const compressedFile = await this.compressImage(file);

      // Subir archivo (con upsert true para sobrescribir si existe)
      const { data, error } = await this.supabase.client.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: true, // Permitir sobrescribir
        });

      if (error) throw error;

      // Obtener URL pública
      const publicUrl = this.getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error('Error subiendo imagen:', error);
      throw error;
    }
  }

  /**
   * Upload product photo
   */
  async uploadProductImage(
    file: File,
    productId: string,
    imageName: string = 'main',
  ): Promise<string> {
    return this.uploadEntityImage(file, 'product', productId, imageName);
  }

  /**
   * Upload employee photo
   */
  async uploadEmployeePhoto(file: File, employeeId: string): Promise<string> {
    return this.uploadEntityImage(file, 'employee', employeeId, 'profile');
  }

  /**
   * Upload restaurant logo
   */
  async uploadRestaurantLogo(file: File, restaurantId: string): Promise<string> {
    return this.uploadEntityImage(file, 'restaurant', restaurantId, 'logo');
  }

  /**
   * Upload image to temporary folder when record does not yet exist.
   * Useful for when you upload an image before creating the product/employee.
   */
  async uploadTempImage(file: File): Promise<string> {
    try {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const fileExt = file.name.split('.').pop();
      const fileName = `${timestamp}_${randomString}.${fileExt}`;

      const filePath = `temp/${fileName}`;

      const compressedFile = await this.compressImage(file);

      const { data, error } = await this.supabase.client.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const publicUrl = this.getPublicUrl(filePath);
      return publicUrl;
    } catch (error: any) {
      console.error('Error subiendo imagen temporal:', error);
      throw error;
    }
  }

  /**
   * Move image from temporary folder to final folder
   */
  async moveTempImageToEntity(
    tempImageUrl: string,
    entityType: 'product' | 'employee' | 'restaurant',
    entityId: string,
    imageName: string = 'main',
  ): Promise<string> {
    try {
      // Obtener el archivo temporal
      const tempPath = this.extractPathFromUrl(tempImageUrl);
      if (!tempPath) throw new Error('URL temporal inválida');

      // Descargar el archivo temporal
      const { data: tempFile, error: downloadError } = await this.supabase.client.storage
        .from(this.BUCKET_NAME)
        .download(tempPath);

      if (downloadError) throw downloadError;

      // Determinar nueva ruta
      const folderMap = {
        product: 'product-images',
        employee: 'employee-photos',
        restaurant: 'restaurant-logos',
      };

      const folder = folderMap[entityType];
      const fileExt = tempPath.split('.').pop();
      const newPath = `${folder}/${entityId}/${imageName}.${fileExt}`;

      // Subir a nueva ubicación
      const { error: uploadError } = await this.supabase.client.storage
        .from(this.BUCKET_NAME)
        .upload(newPath, tempFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Eliminar archivo temporal
      await this.deleteImage(tempPath);

      // Retornar nueva URL
      return this.getPublicUrl(newPath);
    } catch (error: any) {
      console.error('Error moviendo imagen:', error);
      throw error;
    }
  }

  /**
   * Deletes all images from an entity
   */
  async deleteEntityImages(
    entityType: 'product' | 'employee' | 'restaurant',
    entityId: string,
  ): Promise<void> {
    try {
      const folderMap = {
        product: 'product-images',
        employee: 'employee-photos',
        restaurant: 'restaurant-logos',
      };

      const folder = folderMap[entityType];
      const folderPath = `${folder}/${entityId}`;

      // Listar archivos en la carpeta
      const { data: files, error: listError } = await this.supabase.client.storage
        .from(this.BUCKET_NAME)
        .list(folderPath);

      if (listError) throw listError;

      if (!files || files.length === 0) return;

      // Construir paths completos
      const filePaths = files.map((file) => `${folderPath}/${file.name}`);

      // Eliminar todos los archivos
      const { error: deleteError } = await this.supabase.client.storage
        .from(this.BUCKET_NAME)
        .remove(filePaths);

      if (deleteError) throw deleteError;
    } catch (error: any) {
      console.error('Error eliminando carpeta de entidad:', error);
      throw error;
    }
  }

  // Get public URL
  getPublicUrl(filePath: string): string {
    const { data } = this.supabase.client.storage.from(this.BUCKET_NAME).getPublicUrl(filePath);

    return data.publicUrl;
  }

  // Delete individual image
  async deleteImage(filePath: string): Promise<void> {
    try {
      const { error } = await this.supabase.client.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error eliminando imagen:', error);
      throw error;
    }
  }

  //Delete image by url
  async deleteImageByUrl(imageUrl: string): Promise<void> {
    try {
      const filePath = this.extractPathFromUrl(imageUrl);

      if (filePath) {
        await this.deleteImage(filePath);
      }
    } catch (error: any) {
      console.error('Error eliminando imagen por URL:', error);
      throw error;
    }
  }

  //Utils
  private extractPathFromUrl(url: string): string | null {
    try {
      const bucketPath = `/storage/v1/object/public/${this.BUCKET_NAME}/`;
      const index = url.indexOf(bucketPath);

      if (index !== -1) {
        return url.substring(index + bucketPath.length);
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  async compressImage(file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        const img = new Image();

        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Error comprimiendo imagen'));
              }
            },
            'image/jpeg',
            quality,
          );
        };

        img.onerror = () => reject(new Error('Error cargando imagen'));
        img.src = e.target.result;
      };

      reader.onerror = () => reject(new Error('Error leyendo archivo'));
      reader.readAsDataURL(file);
    });
  }
}
