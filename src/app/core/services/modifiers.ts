import { inject, Injectable } from '@angular/core';
import { Modifier } from '@app/core/models/database.types';
import { Supabase } from './supabase';

interface ProductModifier {
  product_id: string;
  modifier_id: string;
  is_default: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class Modifiers {
  private supabase = inject(Supabase);
  constructor() { }

  // Get all modifiers
  async getAllModifiers(restaurantId: string): Promise<Modifier[]> {
    const { data, error } = await this.supabase.withLoading(() => this.supabase.client
      .from('modifiers')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('name'));

    if (error) throw error;
    return data as Modifier[];
  }

  // Create modifier
  async createModifier(modifier: Partial<Modifier>): Promise<Modifier> {
    const { data, error } = await this.supabase.withLoading(() => this.supabase.client
      .from('modifiers')
      .insert(modifier)
      .select()
      .single());

    if (error) throw error;
    return data as Modifier;
  }

  // Update modifier
  async updateModifier(id: string, updates: Partial<Modifier>): Promise<Modifier> {
    const { data, error } = await this.supabase.withLoading(() => this.supabase.client
      .from('modifiers')
      .update(updates)
      .eq('id', id)
      .select()
      .single());

    if (error) throw error;
    return data as Modifier;
  }

  // Delete modifier
  async deleteModifier(id: string): Promise<void> {
    const { error } = await this.supabase.withLoading(() => this.supabase.client
      .from('modifiers')
      .delete()
      .eq('id', id));

    if (error) throw error;
  }

  // Get modifiers for a product
  async getModifiersByProduct(productId: string): Promise<any[]> {
    const { data, error } = await this.supabase.withLoading(() => this.supabase.client
      .from('product_modifiers')
      .select(`
        *,
        modifier:modifiers(*)
      `)
      .eq('product_id', productId));

    if (error) throw error;
    return data;
  }

  // Assign modifier to product
  async assignModifierToProduct(
    productId: string,
    modifierId: string,
    isDefault: boolean = false
  ): Promise<void> {
    const { error } = await this.supabase.withLoading(() => this.supabase.client
      .from('product_modifiers')
      .insert({
        product_id: productId,
        modifier_id: modifierId,
        is_default: isDefault
      }));

    if (error) throw error;
  }

  // Remove modifier from product
  async removeModifierFromProduct(productId: string, modifierId: string): Promise<void> {
    const { error } = await this.supabase.withLoading(() => this.supabase.client
      .from('product_modifiers')
      .delete()
      .eq('product_id', productId)
      .eq('modifier_id', modifierId));

    if (error) throw error;
  }

  // Assign multiple modifiers to a product
  async assignMultipleModifiers(
    productId: string,
    modifierIds: string[]
  ): Promise<void> {
    const data = modifierIds.map(modifierId => ({
      product_id: productId,
      modifier_id: modifierId,
      is_default: false
    }));

    const { error } = await this.supabase.withLoading(() => this.supabase.client
      .from('product_modifiers')
      .insert(data));

    if (error) throw error;
  }
}
