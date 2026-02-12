export interface Restaurant {
    id: string;
    name: string;
    nit: string;
    address?: string;
    phone?: string;
    email?: string;
    logo_url?: string;
    created_at: string;
    updated_at: string;
}

export interface Branch {
    id: string;
    restaurant_id: string;
    name: string;
    address?: string;
    phone?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Category {
    id: string;
    restaurant_id: string;
    name: string;
    description?: string;
    display_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Product {
    id: string;
    category_id?: string;
    name: string;
    description?: string;
    price: number;
    image_url?: string;
    is_available: boolean;
    preparation_time: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Modifier {
    id: string;
    restaurant_id: string;
    name: string;
    price_adjustment: number;
    created_at: string;
}

export interface Table {
    id: string;
    branch_id: string;
    table_number: string;
    capacity: number;
    status: 'available' | 'occupied' | 'reserved' | 'cleaning';
    qr_code?: string;
    created_at: string;
    updated_at: string;
}

export interface Order {
    id: string;
    branch_id: string;
    table_id?: string;
    order_number: string;
    order_type: 'dine_in' | 'takeout' | 'delivery' | 'qr_order';
    status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
    customer_name?: string;
    customer_phone?: string;
    waiter_id?: string;
    subtotal: number;
    tax: number;
    tip: number;
    total: number;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    special_instructions?: string;
    status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
    created_at: string;
    updated_at: string;
}

export interface OrderItemModifier {
    id: string;
    order_item_id: string;
    modifier_id: string;
    modifier_name: string;
    price_adjustment: number;
}

export interface BillSplit {
    id: string;
    order_id: string;
    split_number: number;
    customer_name?: string;
    subtotal: number;
    tax: number;
    tip: number;
    total: number;
    is_paid: boolean;
    created_at: string;
}

export interface Payment {
    id: string;
    order_id: string;
    bill_split_id?: string;
    payment_method: 'cash' | 'card' | 'transfer' | 'qr_payment' | 'mixed';
    amount: number;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    transaction_reference?: string;
    created_by?: string;
    created_at: string;
}

export interface Invoice {
    id: string;
    order_id: string;
    invoice_number: string;
    customer_name: string;
    customer_nit?: string;
    customer_email?: string;
    customer_address?: string;
    subtotal: number;
    tax: number;
    total: number;
    status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'cancelled';
    xml_url?: string;
    pdf_url?: string;
    cufe?: string;
    dian_response?: string;
    created_at: string;
    sent_at?: string;
    accepted_at?: string;
    order?: Order;
}