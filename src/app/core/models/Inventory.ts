export interface InventoryItem {
  id: string;
  branch_id: string;
  name: string;
  unit: string;
  current_stock: number;
  min_stock: number;
  cost_per_unit: number;
  created_at: string;
  updated_at: string;
}

export interface Recipe {
  id: string;
  product_id: string;
  inventory_item_id: string;
  quantity: number;
}

export interface InventoryMovement {
  id: string;
  inventory_item_id: string;
  movement_type: 'purchase' | 'adjustment' | 'consumption' | 'waste';
  quantity: number;
  notes?: string;
  created_by?: string;
  created_at: string;
}
