import { inject, Injectable } from '@angular/core';
import { Category, Product } from '@core/models/database.types';
import { Supabase } from '@services/supabase';

@Injectable({
  providedIn: 'root',
})
export class Products {
  private supabase = inject(Supabase);

  constructor() { }

  // Get all products
  async getAllProducts(): Promise<Product[]> {
    const { data, error } = await this.supabase.client
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data as Product[];
  }

  // Get products by category
  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    const { data, error } = await this.supabase.client
      .from('products')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data as Product[];
  }

  // Get product by ID
  async getProductById(id: string): Promise<Product> {
    const { data, error } = await this.supabase.client
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Product;
  }

  // Create product
  async createProduct(product: Partial<Product>): Promise<Product> {
    const { data, error } = await this.supabase.client
      .from('products')
      .insert(product)
      .select()
      .single();

    if (error) throw error;
    return data as Product;
  }

  // Update product
  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const { data, error } = await this.supabase.client
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Product;
  }

  // Delete product (soft delete)
  async deleteProduct(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('products')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  }

  // Toggle availability
  async toggleAvailability(id: string, isAvailable: boolean): Promise<void> {
    const { error } = await this.supabase.client
      .from('products')
      .update({ is_available: isAvailable })
      .eq('id', id);

    if (error) throw error;
  }

  // Get all categories
  async getAllCategories(): Promise<Category[]> {
    const { data, error } = await this.supabase.client
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) throw error;
    return data as Category[];
  }

  // Create category
  async createCategory(category: Partial<Category>): Promise<Category> {
    const { data, error } = await this.supabase.client
      .from('categories')
      .insert(category)
      .select()
      .single();

    if (error) throw error;
    return data as Category;
  }

  // Update category
  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    const { data, error } = await this.supabase.client
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Category;
  }

  // Delete category (soft delete)
  async deleteCategory(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('categories')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  }
}
