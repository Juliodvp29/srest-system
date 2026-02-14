import { inject, Injectable } from '@angular/core';
import { Order, OrderItem } from '@app/core/models/database.types';
import { Supabase } from './supabase';

@Injectable({
  providedIn: 'root',
})
export class Orders {
  private supabase = inject(Supabase);
  constructor() { }

  // Get active orders for a branch
  async getActiveOrders(branchId: string, skipLoading: boolean = false): Promise<Order[]> {
    const { data, error } = await this.supabase.withLoading(() => this.supabase.client
      .from('orders')
      .select(
        `
        *,
        table:tables(table_number),
        waiter:employees(full_name)
      `,
      )
      .eq('branch_id', branchId)
      .in('status', ['pending', 'preparing', 'ready'])
      .order('created_at', { ascending: false }), { skipLoading });

    if (error) throw error;
    return data as any[];
  }

  // Get order with items
  async getOrderWithItems(orderId: string): Promise<any> {
    const { data, error } = await this.supabase.withLoading(() => this.supabase.client
      .from('orders')
      .select(
        `
        *,
        table:tables(table_number),
        waiter:employees(full_name),
        order_items(
          *,
          product:products(name, price),
          order_item_modifiers(
            *,
            modifier:modifiers(name, price_adjustment)
          )
        )
      `,
      )
      .eq('id', orderId)
      .single());

    if (error) throw error;
    return data;
  }

  // Create new order
  async createOrder(order: Partial<Order>): Promise<Order> {
    // Generate order number
    const orderNumber = await this.generateOrderNumber(order.branch_id!);

    const { data, error } = await this.supabase.withLoading(() => this.supabase.client
      .from('orders')
      .insert({
        ...order,
        order_number: orderNumber,
      })
      .select()
      .single());

    if (error) throw error;
    return data as Order;
  }

  // Generate order number for the day
  private async generateOrderNumber(branchId: string): Promise<string> {
    const today = new Date().toISOString().split('T')[0];

    const { count, error } = await this.supabase.withLoading(() => this.supabase.client
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('branch_id', branchId)
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`));

    if (error) throw error;

    const nextNumber = (count || 0) + 1;
    return `#${String(nextNumber).padStart(3, '0')}`;
  }

  // Add item to order
  async addItemToOrder(orderItem: Partial<OrderItem>): Promise<OrderItem> {
    const { data, error } = await this.supabase.withLoading(() => this.supabase.client
      .from('order_items')
      .insert(orderItem)
      .select()
      .single());

    if (error) throw error;
    return data as OrderItem;
  }

  // Add modifiers to an item
  async addModifiersToItem(
    orderItemId: string,
    modifiers: Array<{ modifier_id: string; modifier_name: string; price_adjustment: number }>,
  ): Promise<void> {
    const modifiersData = modifiers.map((mod) => ({
      order_item_id: orderItemId,
      ...mod,
    }));

    const { error } = await this.supabase.withLoading(() => this.supabase.client.from('order_item_modifiers').insert(modifiersData));

    if (error) throw error;
  }

  // Update order status
  async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    const { error } = await this.supabase.withLoading(() => this.supabase.client
      .from('orders')
      .update({ status })
      .eq('id', orderId));

    if (error) throw error;
  }

  // Update item status
  async updateItemStatus(itemId: string, status: OrderItem['status']): Promise<void> {
    const { error } = await this.supabase.withLoading(() => this.supabase.client
      .from('order_items')
      .update({ status })
      .eq('id', itemId));

    if (error) throw error;
  }

  // Assign waiter to order
  async assignWaiter(orderId: string, waiterId: string | null): Promise<void> {
    const { error } = await this.supabase.withLoading(() => this.supabase.client
      .from('orders')
      .update({ waiter_id: waiterId })
      .eq('id', orderId));

    if (error) throw error;
  }

  // Cancel order
  async cancelOrder(orderId: string): Promise<void> {
    const { error } = await this.supabase.withLoading(() => this.supabase.client
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId));

    if (error) throw error;
  }

  // Split bill
  async splitBill(
    orderId: string,
    splits: Array<{
      customer_name?: string;
      items: Array<{ order_item_id: string; quantity: number; amount: number }>;
    }>,
  ): Promise<void> {
    // Get order details
    const order = await this.getOrderWithItems(orderId);

    for (let i = 0; i < splits.length; i++) {
      const split = splits[i];

      // Calculate subtotal of this split
      const subtotal = split.items.reduce((sum, item) => sum + item.amount, 0);
      const tax = subtotal * 0.19; // IVA 19%
      const total = subtotal + tax;

      // Create bill split record
      const { data: billSplit, error: splitError } = await this.supabase.withLoading(() => this.supabase.client
        .from('bill_splits')
        .insert({
          order_id: orderId,
          split_number: i + 1,
          customer_name: split.customer_name,
          subtotal,
          tax,
          total,
          tip: 0,
        })
        .select()
        .single());

      if (splitError) throw splitError;

      // Assign items to split
      const splitItemsData = split.items.map((item) => ({
        bill_split_id: billSplit.id,
        order_item_id: item.order_item_id,
        quantity: item.quantity,
        amount: item.amount,
      }));

      const { error: itemsError } = await this.supabase.withLoading(() => this.supabase.client
        .from('bill_split_items')
        .insert(splitItemsData));

      if (itemsError) throw itemsError;
    }
  }

  // Get bill splits for an order
  async getBillSplits(orderId: string): Promise<any[]> {
    const { data, error } = await this.supabase.withLoading(() => this.supabase.client
      .from('bill_splits')
      .select(
        `
        *,
        bill_split_items(
          *,
          order_item:order_items(
            *,
            product:products(name)
          )
        )
      `,
      )
      .eq('order_id', orderId)
      .order('split_number'));

    if (error) throw error;
    return data;
  }

  // listen for order changes in a branch
  subscribeToOrders(branchId: string, callback: (payload: any) => void) {
    return this.supabase.client
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `branch_id=eq.${branchId}`,
        },
        callback,
      )
      .subscribe();
  }

  // Listen for order item changes
  subscribeToOrderItems(orderId: string, callback: (payload: any) => void) {
    return this.supabase.client
      .channel('order-items-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items',
          filter: `order_id=eq.${orderId}`,
        },
        callback,
      )
      .subscribe();
  }

  // Listen for changes on a single order
  subscribeToOrder(orderId: string, callback: (payload: any) => void) {
    return this.supabase.client
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        callback,
      )
      .subscribe();
  }

  // Get daily stats
  async getDailyStats(branchId: string): Promise<{ totalSales: number; orderCount: number }> {
    const today = new Date().toISOString().split('T')[0];

    // Get orders for today that are not cancelled
    const { data, error } = await this.supabase.withLoading(() => this.supabase.client
      .from('orders')
      .select('total, status')
      .eq('branch_id', branchId)
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)
      .eq('status', 'delivered'));

    if (error) throw error;

    const orders = data as Order[] | null;

    const totalSales = orders?.reduce((sum: number, order: Order) => sum + (order.total || 0), 0) || 0;
    const orderCount = orders?.length || 0;

    return { totalSales, orderCount };
  }
}
