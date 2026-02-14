import { inject, Injectable } from '@angular/core';
import { Category, Product } from '@core/models/database.types';
import { Supabase } from '@services/supabase';
import { from, map, Observable, tap } from 'rxjs';
import { Storages } from './storages';
import { CacheService } from './cache';

@Injectable({
  providedIn: 'root',
})
export class Products {
  private supabase = inject(Supabase);
  private storages = inject(Storages);
  private cache = inject(CacheService);

  private readonly CATEGORIES_CACHE_KEY = 'categories_all';

  constructor() { }

  // Get all products with category name
  getAllProducts(): Observable<any[]> {
    return from(
      this.supabase.withLoading(() => this.supabase.client
        .from('products')
        .select(
          `
          *,
          categories (
             name
          )
        `,
        )
        .eq('is_active', true)
        .order('name')),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data;
      }),
    );
  }

  // Get paged products (for future large datasets)
  getProductsPaged(page: number, size: number): Observable<{ data: any[]; count: number }> {
    const fromIndex = page * size;
    const toIndex = fromIndex + size - 1;

    return from(
      this.supabase.withLoading(() => this.supabase.client
        .from('products')
        .select('*, categories(name)', { count: 'exact' })
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(fromIndex, toIndex)),
    ).pipe(
      map(({ data, error, count }) => {
        if (error) throw error;
        return { data: data || [], count: count || 0 };
      }),
    );
  }

  // Get products by category
  getProductsByCategory(categoryId: string): Observable<Product[]> {
    return from(
      this.supabase.withLoading(() => this.supabase.client
        .from('products')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('name')),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as Product[];
      }),
    );
  }

  // Get product by ID
  getProductById(id: string): Observable<Product> {
    return from(this.supabase.withLoading(() => this.supabase.client.from('products').select('*').eq('id', id).single())).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as Product;
      }),
    );
  }

  // Create product
  createProduct(product: Partial<Product>): Observable<Product> {
    return from(this.supabase.withLoading(() => this.supabase.client.from('products').insert(product).select().single())).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as Product;
      }),
    );
  }

  // Update product
  updateProduct(id: string, updates: Partial<Product>): Observable<Product> {
    return from(
      this.supabase.withLoading(() => this.supabase.client.from('products').update(updates).eq('id', id).select().single()),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as Product;
      }),
    );
  }

  // Soft delete and cleanup images
  deleteProduct(id: string): Observable<void> {
    return from(
      this.supabase.withLoading(() => this.supabase.client.from('products').update({ is_active: false }).eq('id', id)),
    ).pipe(
      tap(() => this.storages.deleteEntityImages('product', id)),
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  // Toggle availability
  toggleAvailability(id: string, isAvailable: boolean): Observable<void> {
    return from(
      this.supabase.withLoading(() => this.supabase.client.from('products').update({ is_available: isAvailable }).eq('id', id)),
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  // Get categories with auto-caching
  getAllCategories(): Observable<Category[]> {
    return this.cache.cacheObservable(
      this.CATEGORIES_CACHE_KEY,
      from(
        this.supabase.withLoading(() => this.supabase.client
          .from('categories')
          .select('*')
          .eq('is_active', true)
          .order('display_order'))
      ).pipe(
        map(({ data, error }) => {
          if (error) throw error;
          return data as Category[];
        })
      )
    );
  }

  // Create category
  createCategory(category: Partial<Category>): Observable<Category> {
    return from(this.supabase.client.from('categories').insert(category).select().single()).pipe(
      tap(() => this.cache.invalidate(this.CATEGORIES_CACHE_KEY)),
      map(({ data, error }) => {
        if (error) throw error;
        return data as Category;
      }),
    );
  }

  // Update category
  updateCategory(id: string, updates: Partial<Category>): Observable<Category> {
    return from(
      this.supabase.client.from('categories').update(updates).eq('id', id).select().single(),
    ).pipe(
      tap(() => this.cache.invalidate(this.CATEGORIES_CACHE_KEY)),
      map(({ data, error }) => {
        if (error) throw error;
        return data as Category;
      }),
    );
  }

  // Soft delete category and invalidate cache
  deleteCategory(id: string): Observable<void> {
    return from(
      this.supabase.client.from('categories').update({ is_active: false }).eq('id', id),
    ).pipe(
      tap(() => this.cache.invalidate(this.CATEGORIES_CACHE_KEY)),
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }
}
