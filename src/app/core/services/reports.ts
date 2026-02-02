import { inject, Injectable } from '@angular/core';
import { Supabase } from './supabase';

@Injectable({
  providedIn: 'root',
})
export class Reports {
  private supabase = inject(Supabase);

  async getSalesData(branchId: string, startDate: Date, endDate: Date) {
    const { data, error } = await this.supabase.client
      .from('orders')
      .select('total, created_at, status')
      .eq('branch_id', branchId)
      .eq('status', 'delivered')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  async getTopProducts(branchId: string, startDate: Date, endDate: Date, limit = 5) {
    // Fetch delivered order items within range
    const { data, error } = await this.supabase.client
      .from('order_items')
      .select(
        `
            quantity, 
            subtotal, 
            product:products(name),
            order:orders!inner(created_at, branch_id)
        `,
      )
      .eq('status', 'delivered')
      .eq('order.branch_id', branchId)
      .gte('order.created_at', startDate.toISOString())
      .lte('order.created_at', endDate.toISOString());

    if (error) throw error;

    // Aggregate in JS for now as simple Supabase grouping is limited
    const aggregation = (data as any[]).reduce((acc, item) => {
      const name = item.product.name;
      if (!acc[name]) {
        acc[name] = { name, quantity: 0, total: 0 };
      }
      acc[name].quantity += item.quantity;
      acc[name].total += item.subtotal;
      return acc;
    }, {});

    return Object.values(aggregation)
      .sort((a: any, b: any) => b.total - a.total)
      .slice(0, limit);
  }

  async getEmployeePerformance(branchId: string, startDate: Date, endDate: Date) {
    const { data, error } = await this.supabase.client
      .from('orders')
      .select('total, waiter:employees(full_name)')
      .eq('branch_id', branchId)
      .eq('status', 'delivered')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw error;

    const aggregation = (data as any[]).reduce((acc, order) => {
      const name = order.waiter?.full_name || 'Sin Mesero';
      if (!acc[name]) {
        acc[name] = { name, sales: 0, count: 0 };
      }
      acc[name].sales += order.total;
      acc[name].count += 1;
      return acc;
    }, {});

    return Object.values(aggregation).sort((a: any, b: any) => b.sales - a.sales);
  }

  async getInvoices(branchId: string, startDate: Date, endDate: Date) {
    const { data, error } = await this.supabase.client
      .from('orders')
      .select(
        `
        id,
        order_number,
        total,
        created_at,
        status,
        payment_method,
        customer_name,
        waiter:employees(full_name)
      `,
      )
      .eq('branch_id', branchId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString() + 'T23:59:59')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getInventoryData(branchId: string) {
    const { data, error } = await this.supabase.client
      .from('products')
      .select(
        `
        id,
        name,
        stock,
        min_stock,
        price,
        category:categories(name)
      `,
      )
      .eq('branch_id', branchId)
      .order('stock', { ascending: true });

    if (error) throw error;
    return data;
  }
}
