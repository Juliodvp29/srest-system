import { inject, Injectable } from '@angular/core';
import { Invoice, Payment } from '@app/core/models/database.types';
import { Supabase } from './supabase';

@Injectable({
  providedIn: 'root',
})
export class Payments {
  private supabase = inject(Supabase);
  constructor() { }

  // Process full payment for an order
  async processPayment(payment: {
    orderId: string;
    paymentMethod: Payment['payment_method'];
    amount: number;
    billSplitId?: string;
    transactionReference?: string;
  }): Promise<Payment> {
    const { data, error } = await this.supabase.client
      .from('payments')
      .insert({
        order_id: payment.orderId,
        bill_split_id: payment.billSplitId,
        payment_method: payment.paymentMethod,
        amount: payment.amount,
        status: 'completed',
        transaction_reference: payment.transactionReference
      })
      .select()
      .single();

    if (error) throw error;

    // If there is bill_split_id, mark as paid
    if (payment.billSplitId) {
      await this.markSplitAsPaid(payment.billSplitId);
    } else {
      // If no split, update order status
      await this.supabase.client
        .from('orders')
        .update({ status: 'delivered' })
        .eq('id', payment.orderId);
    }

    // Check if fully paid and generate invoice
    if (await this.isOrderFullyPaid(payment.orderId)) {
      // Check if invoice already exists
      const existingInvoice = await this.getInvoiceByOrder(payment.orderId);
      if (!existingInvoice) {
        await this.generateInvoiceFromOrder(payment.orderId);
      }
    }

    return data as Payment;
  }

  // Mark split as paid
  private async markSplitAsPaid(billSplitId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('bill_splits')
      .update({ is_paid: true })
      .eq('id', billSplitId);

    if (error) throw error;
  }

  // Get payments for an order
  async getPaymentsByOrder(orderId: string): Promise<Payment[]> {
    const { data, error } = await this.supabase.client
      .from('payments')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at');

    if (error) throw error;
    return data as Payment[];
  }

  // Verify if order is fully paid
  async isOrderFullyPaid(orderId: string): Promise<boolean> {
    // Get order total
    const { data: order, error: orderError } = await this.supabase.client
      .from('orders')
      .select('total')
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;

    // Get sum of payments
    const { data: payments, error: paymentsError } = await this.supabase.client
      .from('payments')
      .select('amount')
      .eq('order_id', orderId)
      .eq('status', 'completed');

    if (paymentsError) throw paymentsError;

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    return totalPaid >= order.total;
  }

  // Process mixed payment (cash + card)
  async processMixedPayment(
    orderId: string,
    cashAmount: number,
    cardAmount: number
  ): Promise<Payment[]> {
    const payments: Payment[] = [];

    // Cash payment
    if (cashAmount > 0) {
      const cashPayment = await this.processPayment({
        orderId,
        paymentMethod: 'cash',
        amount: cashAmount
      });
      payments.push(cashPayment);
    }

    // Card payment
    if (cardAmount > 0) {
      const cardPayment = await this.processPayment({
        orderId,
        paymentMethod: 'card',
        amount: cardAmount
      });
      payments.push(cardPayment);
    }

    return payments;
  }

  // Process refund
  async processRefund(paymentId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('payments')
      .update({ status: 'refunded' })
      .eq('id', paymentId);

    if (error) throw error;
  }


  // Create invoice (without DIAN integration - only internal record)
  async createInvoice(invoice: Partial<Invoice>): Promise<Invoice> {
    // Generate consecutive number
    const invoiceNumber = await this.generateInvoiceNumber();

    const { data, error } = await this.supabase.client
      .from('invoices')
      .insert({
        ...invoice,
        invoice_number: invoiceNumber,
        status: 'accepted'
      })
      .select()
      .single();

    if (error) throw error;
    return data as Invoice;
  }

  // Generate consecutive number of invoice
  private async generateInvoiceNumber(): Promise<string> {
    const { count, error } = await this.supabase.client
      .from('invoices')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    const nextNumber = (count || 0) + 1;
    return `FV-${String(nextNumber).padStart(6, '0')}`;
  }

  // Generate invoice from order
  async generateInvoiceFromOrder(
    orderId: string,
    customerData?: {
      name?: string;
      nit?: string;
      email?: string;
      address?: string;
    }
  ): Promise<Invoice> {
    // Get complete order
    const { data: order, error: orderError } = await this.supabase.client
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;

    // Create invoice
    const invoice = await this.createInvoice({
      order_id: orderId,
      customer_name: customerData?.name || order.customer_name || 'Cliente Mostrador',
      customer_nit: customerData?.nit || '222222222',
      customer_email: customerData?.email,
      customer_address: customerData?.address,
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total
    });

    return invoice;
  }

  // Get invoice by order
  async getInvoiceByOrder(orderId: string): Promise<Invoice | null> {
    const { data, error } = await this.supabase.client
      .from('invoices')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle();

    if (error) throw error;
    return data as Invoice | null;
  }

  // Get all invoices
  async getAllInvoices(limit: number = 50): Promise<Invoice[]> {
    const { data, error } = await this.supabase.client
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as Invoice[];
  }

  // Search invoices by date range
  async getInvoicesByDateRange(startDate: string, endDate: string): Promise<Invoice[]> {
    const { data, error } = await this.supabase.client
      .from('invoices')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Invoice[];
  }

  // Generate electronic invoice
  async generateElectronicInvoice(orderId: string): Promise<any> {
    // Future implementation for DIAN integration
    throw new Error('Electronic invoice generation not implemented yet.');
  }

  // Cancel invoice
  async cancelInvoice(invoiceId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('invoices')
      .update({ status: 'cancelled' })
      .eq('id', invoiceId);

    if (error) throw error;
  }

  // Get daily sales
  async getDailySales(branchId: string, date?: string): Promise<number> {
    const targetDate = date || new Date().toISOString().split('T')[0];

    const { data, error } = await this.supabase.client
      .from('orders')
      .select('total')
      .eq('branch_id', branchId)
      .gte('created_at', `${targetDate}T00:00:00`)
      .lte('created_at', `${targetDate}T23:59:59`)
      .in('status', ['delivered']);

    if (error) throw error;

    return data.reduce((sum, order) => sum + order.total, 0);
  }

  // Get sales by payment method
  async getSalesByPaymentMethod(branchId: string, date?: string): Promise<any> {
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Get orders from the day
    const { data: orders, error: ordersError } = await this.supabase.client
      .from('orders')
      .select('id')
      .eq('branch_id', branchId)
      .gte('created_at', `${targetDate}T00:00:00`)
      .lte('created_at', `${targetDate}T23:59:59`)
      .in('status', ['delivered']);

    if (ordersError) throw ordersError;

    const orderIds = orders.map(o => o.id);

    if (orderIds.length === 0) {
      return {
        cash: 0,
        card: 0,
        transfer: 0,
        qr_payment: 0,
        mixed: 0
      };
    }

    // Get payments
    const { data: payments, error: paymentsError } = await this.supabase.client
      .from('payments')
      .select('payment_method, amount')
      .in('order_id', orderIds)
      .eq('status', 'completed');

    if (paymentsError) throw paymentsError;

    // Group by payment method
    return payments.reduce((acc, payment) => {
      acc[payment.payment_method] = (acc[payment.payment_method] || 0) + payment.amount;
      return acc;
    }, {} as Record<string, number>);
  }
}
