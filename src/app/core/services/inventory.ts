import { inject, Injectable } from '@angular/core';
import { InventoryItem, InventoryMovement, Recipe } from '@app/core/models/Inventory';
import { Supabase } from './supabase';
import { CacheService } from './cache';

@Injectable({
  providedIn: 'root',
})
export class Inventory {
  private supabase = inject(Supabase);
  private cache = inject(CacheService);

  private readonly INVENTORY_CACHE_PREFIX = 'inventory_items_';

  constructor() { }

  // Get all items
  async getAllInventoryItems(branchId: string): Promise<InventoryItem[]> {
    const cacheKey = `${this.INVENTORY_CACHE_PREFIX}${branchId}`;

    return this.cache.cachePromise(cacheKey, async () => {
      const { data, error } = await this.supabase.client
        .from('inventory_items')
        .select('*')
        .eq('branch_id', branchId)
        .order('name');

      if (error) throw error;
      return data as InventoryItem[];
    });
  }

  // Get items with low stock
  async getLowStockItems(branchId: string): Promise<InventoryItem[]> {
    const { data, error } = await this.supabase.client
      .from('inventory_items')
      .select('*')
      .eq('branch_id', branchId);

    if (error) throw error;

    return (data as InventoryItem[])
      .filter((item) => item.current_stock <= item.min_stock)
      .sort((a, b) => a.current_stock - b.current_stock);
  }

  // Create inventory item
  async createInventoryItem(item: Partial<InventoryItem>): Promise<InventoryItem> {
    const { data, error } = await this.supabase.client
      .from('inventory_items')
      .insert(item)
      .select()
      .single();

    if (error) throw error;

    if (data.branch_id) {
      this.cache.invalidate(`${this.INVENTORY_CACHE_PREFIX}${data.branch_id}`);
    }

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

    if (data.branch_id) {
      this.cache.invalidate(`${this.INVENTORY_CACHE_PREFIX}${data.branch_id}`);
    }

    return data as InventoryItem;
  }

  // Delete inventory item
  async deleteInventoryItem(id: string): Promise<void> {
    // We need the branch_id to invalidate cache, so we fetch it first or use a prefix invalidation
    // To be safe and simple, we can invalidate all inventory caches or just the specific one if we had the branchId
    // Since this is less frequent, let's invalidate by prefix
    const { error } = await this.supabase.client.from('inventory_items').delete().eq('id', id);

    if (error) throw error;

    this.cache.invalidateByPrefix(this.INVENTORY_CACHE_PREFIX);
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
    // Stock is updated by DB trigger 'trigger_apply_inventory_movement'
  }

  // Register consumption (manual or external)
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
    // Stock is updated by DB trigger 'trigger_apply_inventory_movement'
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
    // Stock is updated by DB trigger 'trigger_apply_inventory_movement'
  }

  // Register waste
  async registerWaste(inventoryItemId: string, quantity: number, notes?: string): Promise<void> {
    await this.createMovement({
      inventory_item_id: inventoryItemId,
      movement_type: 'waste',
      quantity: -quantity,
      notes,
    });
    // Stock is updated by DB trigger 'trigger_apply_inventory_movement'
  }

  // Create movement
  private async createMovement(movement: Partial<InventoryMovement>): Promise<InventoryMovement> {
    const { data, error } = await this.supabase.client
      .from('inventory_movements')
      .insert(movement)
      .select()
      .single();

    if (error) throw error;

    // DB trigger handles stock; invalidate cache to reflect changes
    this.cache.invalidateByPrefix(this.INVENTORY_CACHE_PREFIX);
    return data as InventoryMovement;
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

  /**
   * @deprecated Stock is now consumed automatically by database trigger 'consume_inventory' 
   * when an order_item status is set to 'completed' (or 'delivered').
   */
  async consumeInventoryForProduct(productId: string, quantity: number = 1): Promise<void> {
    // Handled by DB trigger 'consume_inventory' on order_items update
    console.log(`Inventory for product ${productId} is handled automatically by DB triggers.`);
  }

  // Delete recipe
  async deleteRecipe(recipeId: string): Promise<void> {
    const { error } = await this.supabase.client.from('recipes').delete().eq('id', recipeId);

    if (error) throw error;
  }
}
