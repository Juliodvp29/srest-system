import { inject, Injectable } from '@angular/core';
import { Invoice } from '@app/core/models/database.types';
import { Supabase } from './supabase';

@Injectable({
    providedIn: 'root',
})
export class Invoices {
    private supabase = inject(Supabase);

    // Get invoices for a branch with filters
    async getInvoices(
        branchId: string,
        filters?: {
            startDate?: Date;
            endDate?: Date;
            search?: string;
            status?: Invoice['status'];
        },
    ): Promise<Invoice[]> {
        let query = this.supabase.client
            .from('invoices')
            .select(
                `
        *,
        order:orders(order_number, branch_id)
      `,
            )
            // .eq('order.branch_id', branchId)
            .order('created_at', { ascending: false });

        // if (filters?.startDate) {
        //     query = query.gte('created_at', filters.startDate.toISOString());
        // }

        // if (filters?.endDate) {
        //     // Set to end of day
        //     const endDate = new Date(filters.endDate);
        //     endDate.setHours(23, 59, 59, 999);
        //     query = query.lte('created_at', endDate.toISOString());
        // }

        if (filters?.status) {
            query = query.eq('status', filters.status);
        }

        if (filters?.search) {
            const search = filters.search.toLowerCase();
            // Searching by invoice number or customer name
            // Note: Supabase OR with foreign tables can be tricky, keeping it simple for now
            query = query.or(`invoice_number.ilike.%${search}%,customer_name.ilike.%${search}%`);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data as any[];
    }

    // Get active invoices for a branch (e.g., specific date range default)
    async getRecentInvoices(branchId: string): Promise<Invoice[]> {
        const { data, error } = await this.supabase.client
            .from('invoices')
            .select(
                `
        *,
        order:orders!inner(order_number, branch_id)
      `,
            )
            // We need to filter by branch_id through the order relation, 
            // but RLS might handle this if policies are set correctly on invoices.
            // Assuming we need to join to filter:
            .eq('order.branch_id', branchId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;
        return data as any[];
    }

    // Get invoice by ID
    async getInvoice(invoiceId: string): Promise<any> {
        const { data, error } = await this.supabase.client
            .from('invoices')
            .select(
                `
        *,
        order:orders(
          *,
          order_items(
            *,
            product:products(name),
            order_item_modifiers(
              *,
              modifier:modifiers(name)
            )
          )
        )
      `,
            )
            .eq('id', invoiceId)
            .single();

        if (error) throw error;
        return data;
    }

    // Get invoice by Order ID
    async getInvoiceByOrderId(orderId: string): Promise<Invoice | null> {
        const { data, error } = await this.supabase.client
            .from('invoices')
            .select('*')
            .eq('order_id', orderId)
            .maybeSingle();

        if (error) throw error;
        return data;
    }

    // Create new invoice
    async createInvoice(invoice: Partial<Invoice>): Promise<Invoice> {
        // Generate invoice number 
        // In a real scenario this might be handled by a database function or a separate service to ensure sequentiality
        // For now, we'll assume the frontend or a simple backend logic provides or generates it, 
        // or we generate a provisional one here.

        // Let's rely on the provided object having the number or backend handling it if it's auto-generated.
        // If we need to generate it similar to orders:
        if (!invoice.invoice_number) {
            // Logic to generate invoice number if needed
        }

        const { data, error } = await this.supabase.client
            .from('invoices')
            .insert(invoice)
            .select()
            .single();

        if (error) throw error;
        return data as Invoice;
    }

    // Update invoice
    async updateInvoice(invoiceId: string, updates: Partial<Invoice>): Promise<Invoice> {
        const { data, error } = await this.supabase.client
            .from('invoices')
            .update(updates)
            .eq('id', invoiceId)
            .select()
            .single();

        if (error) throw error;
        return data as Invoice;
    }
}
