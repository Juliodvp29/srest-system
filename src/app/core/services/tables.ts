import { inject, Injectable } from '@angular/core';
import { Table } from '@app/core/models/database.types';
import { Supabase } from './supabase';

@Injectable({
  providedIn: 'root',
})
export class Tables {
  private supabase = inject(Supabase);
  constructor() { }

  // Get tables by branch
  async getTablesByBranch(branchId: string): Promise<Table[]> {
    const { data, error } = await this.supabase.client
      .from('tables')
      .select('*')
      .eq('branch_id', branchId)
      .order('table_number');

    if (error) throw error;
    return data as Table[];
  }

  // Get available tables
  async getAvailableTables(branchId: string): Promise<Table[]> {
    const { data, error } = await this.supabase.client
      .from('tables')
      .select('*')
      .eq('branch_id', branchId)
      .eq('status', 'available')
      .order('table_number');

    if (error) throw error;
    return data as Table[];
  }

  // Get table by ID
  async getTableById(id: string): Promise<Table> {
    const { data, error } = await this.supabase.client
      .from('tables')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Table;
  }

  // Get table by number
  async getTableByNumber(branchId: string, tableNumber: string): Promise<Table> {
    const { data, error } = await this.supabase.client
      .from('tables')
      .select('*')
      .eq('branch_id', branchId)
      .eq('table_number', tableNumber)
      .single();

    if (error) throw error;
    return data as Table;
  }

  // Create table
  async createTable(table: Partial<Table>): Promise<Table> {
    // Generate QR code URL
    const qrCode = `https://menu.turestaurante.com/table/${table.table_number}`;

    const { data, error } = await this.supabase.client
      .from('tables')
      .insert({
        ...table,
        qr_code: qrCode,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Table;
  }

  // Update table
  async updateTable(id: string, updates: Partial<Table>): Promise<Table> {
    const { data, error } = await this.supabase.client
      .from('tables')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Table;
  }

  // Change table status
  async updateTableStatus(
    id: string,
    status: 'available' | 'occupied' | 'reserved' | 'cleaning',
  ): Promise<void> {
    const { error } = await this.supabase.client.from('tables').update({ status }).eq('id', id);

    if (error) throw error;
  }

  // Occupy table (when an order is created)
  async occupyTable(tableId: string): Promise<void> {
    // Explicitly set occupied, then check if it should be something else (though orders win)
    await this.updateTableStatus(tableId, 'occupied');
  }

  // Release table (when payment is made and order is closed)
  async releaseTable(tableId: string): Promise<void> {
    // Instead of just setting available, do a full check to see if it should be 'reserved'
    await this.checkAndUpdateTableStatus(tableId);
  }

  // Check and update table status based on active orders and today's reservations
  async checkAndUpdateTableStatus(tableId: string): Promise<void> {
    // 1. Check for active orders (highest priority: 'occupied')
    const { count: orderCount, error: orderError } = await this.supabase.client
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('table_id', tableId)
      .in('status', ['pending', 'preparing', 'ready']);

    if (orderError) throw orderError;

    if (orderCount && orderCount > 0) {
      await this.updateTableStatus(tableId, 'occupied');
      return;
    }

    // 2. Check for reservations TODAY (booked or confirmed only)
    // Use a more robust date range (local start to local end of today)
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

    const { count: resCount, error: resError } = await this.supabase.client
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('table_id', tableId)
      .in('status', ['booked', 'confirmed'])
      .gte('reservation_time', start)
      .lte('reservation_time', end);

    if (resError) throw resError;

    // If no active orders, determine if it's reserved or available
    if (resCount && resCount > 0) {
      await this.updateTableStatus(tableId, 'reserved');
    } else {
      // Return to available only if it was occupied/reserved (preserve 'cleaning' if manually set)
      const currentTable = await this.getTableById(tableId);
      if (currentTable.status === 'occupied' || currentTable.status === 'reserved') {
        await this.updateTableStatus(tableId, 'available');
      }
    }
  }

  // Mark table for cleaning
  async markTableForCleaning(tableId: string): Promise<void> {
    await this.updateTableStatus(tableId, 'cleaning');
  }

  // Delete table
  async deleteTable(id: string): Promise<void> {
    const { error } = await this.supabase.client.from('tables').delete().eq('id', id);

    if (error) throw error;
  }

  // Get active order for a table
  async getActiveOrderByTable(tableId: string): Promise<any | null> {
    const { data, error } = await this.supabase.client
      .from('orders')
      .select(
        `
        *,
        order_items(
          *,
          product:products(name, price),
          order_item_modifiers(
            modifier_name,
            price_adjustment
          )
        )
      `,
      )
      .eq('table_id', tableId)
      .in('status', ['pending', 'preparing', 'ready'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  // Listen for changes in tables
  subscribeToTables(branchId: string, callback: (payload: any) => void) {
    return this.supabase.client
      .channel('tables-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tables',
          filter: `branch_id=eq.${branchId}`,
        },
        callback,
      )
      .subscribe();
  }
}
