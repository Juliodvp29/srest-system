import { inject, Injectable } from '@angular/core';
import { InventoryItem, InventoryMovement, Recipe } from '@app/core/models/Inventory';
import { Supabase } from './supabase';

@Injectable({
  providedIn: 'root',
})
export class Inventory {
  private supabase = inject(Supabase);
  constructor() {}

  // Get all items
  async getAllInventoryItems(branchId: string): Promise<InventoryItem[]> {
    const { data, error } = await this.supabase.client
      .from('inventory_items')
      .select('*')
      .eq('branch_id', branchId)
      .order('name');

    if (error) throw error;
    return data as InventoryItem[];
  }

  // Get items with low stock
  async getLowStockItems(branchId: string): Promise<InventoryItem[]> {
    const { data, error } = await this.supabase.client
      .from('inventory_items')
      .select('*')
      .eq('branch_id', branchId)
      .filter('current_stock', 'lte', 'min_stock')
      .order('current_stock');

    if (error) throw error;
    return data as InventoryItem[];
  }

  // Create inventory item
  async createInventoryItem(item: Partial<InventoryItem>): Promise<InventoryItem> {
    const { data, error } = await this.supabase.client
      .from('inventory_items')
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    return data as InventoryItem;
  }

  // Update inventory item
  async updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    const { data, error } = await this.supabase.client
      .from('inventory_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as InventoryItem;
  }

  // Delete inventory item
  async deleteInventoryItem(id: string): Promise<void> {
    const { error } = await this.supabase.client.from('inventory_items').delete().eq('id', id);

    if (error) throw error;
  }

  // Register purchase
  async registerPurchase(inventoryItemId: string, quantity: number, notes?: string): Promise<void> {
    // Create movement
    await this.createMovement({
      inventory_item_id: inventoryItemId,
      movement_type: 'purchase',
      quantity,
      notes,
    });

    // Update stock
    await this.adjustStock(inventoryItemId, quantity);
  }

  // Register consumption (when preparing a dish)
  async registerConsumption(
    inventoryItemId: string,
    quantity: number,
    notes?: string,
  ): Promise<void> {
    // Create movement
    await this.createMovement({
      inventory_item_id: inventoryItemId,
      movement_type: 'consumption',
      quantity: -quantity, // negative because it's consumed
      notes,
    });

    // Update stock
    await this.adjustStock(inventoryItemId, -quantity);
  }

  // Register manual adjustment
  async registerAdjustment(
    inventoryItemId: string,
    quantity: number,
    notes: string,
  ): Promise<void> {
    await this.createMovement({
      inventory_item_id: inventoryItemId,
      movement_type: 'adjustment',
      quantity,
      notes,
    });

    await this.adjustStock(inventoryItemId, quantity);
  }

  // Register waste
  async registerWaste(inventoryItemId: string, quantity: number, notes?: string): Promise<void> {
    await this.createMovement({
      inventory_item_id: inventoryItemId,
      movement_type: 'waste',
      quantity: -quantity,
      notes,
    });

    await this.adjustStock(inventoryItemId, -quantity);
  }

  // Create movement
  private async createMovement(movement: Partial<InventoryMovement>): Promise<InventoryMovement> {
    const { data, error } = await this.supabase.client
      .from('inventory_movements')
      .insert(movement)
      .select()
      .single();

    if (error) throw error;
    return data as InventoryMovement;
  }

  // Adjust stock
  private async adjustStock(inventoryItemId: string, quantityChange: number): Promise<void> {
    // Get current stock
    const { data: item, error: getError } = await this.supabase.client
      .from('inventory_items')
      .select('current_stock')
      .eq('id', inventoryItemId)
      .single();

    if (getError) throw getError;

    // Update stock
    const newStock = item.current_stock + quantityChange;

    const { error: updateError } = await this.supabase.client
      .from('inventory_items')
      .update({ current_stock: newStock })
      .eq('id', inventoryItemId);

    if (updateError) throw updateError;
  }

  async getMovementHistory(
    inventoryItemId: string,
    limit: number = 50,
  ): Promise<InventoryMovement[]> {
    const { data, error } = await this.supabase.client
      .from('inventory_movements')
      .select('*')
      .eq('inventory_item_id', inventoryItemId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as InventoryMovement[];
  }

  // Get all movements for a branch
  async getAllMovements(branchId: string, limit: number = 100): Promise<any[]> {
    const { data, error } = await this.supabase.client
      .from('inventory_movements')
      .select(
        `
        *,
        inventory_item:inventory_items!inner(
          name,
          unit,
          branch_id
        )
      `,
      )
      .eq('inventory_items.branch_id', branchId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  // Create recipe for a product
  async createRecipe(recipe: Partial<Recipe>): Promise<Recipe> {
    const { data, error } = await this.supabase.client
      .from('recipes')
      .insert(recipe)
      .select()
      .single();

    if (error) throw error;
    return data as Recipe;
  }

  // Get recipe for a product
  async getRecipeByProduct(productId: string): Promise<any[]> {
    const { data, error } = await this.supabase.client
      .from('recipes')
      .select(
        `
        *,
        inventory_item:inventory_items(
          id,
          name,
          unit,
          current_stock,
          cost_per_unit
        )
      `,
      )
      .eq('product_id', productId);

    if (error) throw error;
    return data;
  }

  // Check if there is enough stock to prepare a product
  async checkStockForProduct(
    productId: string,
    quantity: number = 1,
  ): Promise<{
    hasStock: boolean;
    missingItems: string[];
  }> {
    const recipe = await this.getRecipeByProduct(productId);
    const missingItems: string[] = [];

    for (const ingredient of recipe) {
      const required = ingredient.quantity * quantity;
      const available = ingredient.inventory_item.current_stock;

      if (available < required) {
        missingItems.push(
          `${ingredient.inventory_item.name} (necesitas ${required} ${ingredient.inventory_item.unit}, tienes ${available})`,
        );
      }
    }

    return {
      hasStock: missingItems.length === 0,
      missingItems,
    };
  }

  // Consume inventory when preparing a product
  async consumeInventoryForProduct(productId: string, quantity: number = 1): Promise<void> {
    const recipe = await this.getRecipeByProduct(productId);

    for (const ingredient of recipe) {
      const consumedQuantity = ingredient.quantity * quantity;

      await this.registerConsumption(
        ingredient.inventory_item_id,
        consumedQuantity,
        `Preparación de producto ID: ${productId}`,
      );
    }
  }

  // Delete recipe
  async deleteRecipe(recipeId: string): Promise<void> {
    const { error } = await this.supabase.client.from('recipes').delete().eq('id', recipeId);

    if (error) throw error;
  }
}
